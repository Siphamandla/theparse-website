# Client portal: setup

The client portal lives at `/portal` and the staff area at `/admin`. Both are part of this Next.js app.

- **Sign-in:** a link emailed through Resend, or Google if it's configured.
- **Access:** invite-only. Nobody can sign up on their own.
- **Data:** stored in the existing `theParse` MongoDB database.
- **Files:** stored in Cloudflare R2.

## 1. Environment variables

Add these to `.env.local` for local development, and to your hosting provider for production.

| Variable | Required | What it is |
|---|---|---|
| `AUTH_SECRET` | Yes | Random secret that signs sessions. Generate one with `openssl rand -base64 32`. |
| `AUTH_URL` | Yes in production | The site's public address, e.g. `https://theparse.co.za`. It must match the domain people actually use (with or without `www`). Locally, use `http://localhost:3000`. |
| `PORTAL_ADMIN_EMAILS` | Yes | Comma-separated emails of theParse staff who can open `/admin`, e.g. `sipho@theparse.co.za,info@theparse.co.za`. |
| `PORTAL_NOTIFY_EMAIL` | No | Where staff notifications go (onboarding completed, team changes, link requests). Defaults to `ADMIN_EMAIL`. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME` | Already set | The existing Resend settings. They're reused for invite and sign-in emails. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | For attachments | See section 2. Without them the portal still works, but the onboarding form tells clients that uploads aren't switched on yet. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | No | Turns on "Continue with Google". In Google Cloud Console, set the redirect URI to `https://theparse.co.za/api/auth/callback/google`. |

## 2. Cloudflare R2 (file storage)

Setup takes about 15 minutes and only has to be done once.

1. **Create the bucket.**
   1. In the Cloudflare dashboard, open **R2 Object Storage**. If this is your first time, enable R2. Cloudflare asks for a payment method, but the free tier covers 10 GB of storage, and downloads are always free.
   2. Click **Create bucket** and name it `theparse-portal`. Leave the location on *Automatic*.
   3. Leave **Public access** turned **off**. Files are only ever served through 5-minute download links, and only after the portal checks that the person is allowed to see them.
2. **Allow browser uploads (CORS).** Open the bucket, then **Settings → CORS policy → Edit**, and paste:
   ```json
   [
     {
       "AllowedOrigins": ["https://theparse.co.za", "https://www.theparse.co.za", "http://localhost:3000"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["content-type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
3. **Create an API token.**
   1. On the R2 overview page, open **Manage R2 API Tokens → Create API token**.
   2. Under Permissions, choose **Object Read & Write**.
   3. Under Specify bucket(s), choose **Apply to specific buckets only → theparse-portal**.
   4. Create the token. Copy the **Access Key ID** and **Secret Access Key** straight away, because the secret is only shown once.
4. **Copy the Account ID.** It's shown on the right of the R2 overview page.
5. **Set the environment variables:**
   ```
   R2_ACCOUNT_ID=<account id>
   R2_ACCESS_KEY_ID=<access key id>
   R2_SECRET_ACCESS_KEY=<secret access key>
   R2_BUCKET=theparse-portal
   ```

The storage code uses the standard S3 interface. If a client ever needs their data stored in South Africa, switching to AWS S3 in `af-south-1` only means changing the endpoint and region in `src/lib/portal/storage.ts`.

## 3. First sign-in as staff

1. Add your email to `PORTAL_ADMIN_EMAILS`.
2. Go to `/portal/signin`, enter that email and click the link that arrives. You'll land in `/admin`.
3. Go to **Invites**, fill in a client's details and send the invite.

## How it works

| Step | What happens |
|---|---|
| Admin sends an invite (`/admin/invites`) | A random single-use token is created. Only its SHA-256 hash is stored. The link expires after 3, 7 or 14 days. Sending a new invite to the same address cancels the old link. |
| Client opens `/portal/invite/<token>` | They confirm their details and choose services. They can add a message, attachments (uploaded straight to R2, up to 5 files of 10 MB each) and colleagues. |
| Client submits | The invite is marked as used (this happens once, even if they submit twice). Their user account, organisation (status *Needs review*, or *Active* for existing clients), owner membership and onboarding submission are created. Each colleague gets their own invite. Staff get an email and the client is signed straight in. |
| Link has expired | The page offers **Request a new link**. Staff are emailed, and the invite shows as *Re-requested* in the admin area. |
| Team management | Owners and Admins use `/portal/team` to invite colleagues (up to 10 people per client, including pending invites), change roles and remove people. Staff are emailed whenever a client adds someone. |

### MongoDB collections

| Collection | Contents |
|---|---|
| `users`, `accounts`, `sessions`, `verification_tokens` | Created and managed by Auth.js |
| `organizations` | One per client organisation |
| `memberships` | Links users to organisations, with a role |
| `invites` | Client and team invites |
| `onboarding_submissions` | What each client submitted during onboarding |
| `org_notes` | Staff-only notes on a client |
| `org_documents` | Files staff attach to a client (stored in R2 under `orgs/{orgId}/`); shared ones show in the client's portal |
| `org_contracts` | Contracts sent to a client to sign; files are in `org_documents` (category `contract`, R2 `orgs/{orgId}/contracts/`) |
| `org_invoices` | Invoices recorded for a client (amount in cents, ZAR); optional PDF in R2 `orgs/{orgId}/invoices/` and an optional payment link |
| `audit_log` | Who did what, and when |
| `contacts-us` | The existing contact form collection. It now also has a `status` field (`new`, `invited` or `archived`) used by the Leads page. |

Indexes are created automatically the first time someone signs in.
