import Image from "next/image";
import Link from "next/link";

/** The real theParse logo (public/images/logo/logo-2.png). */
export default function Logo({ href = "/", height = 40 }: { href?: string; height?: number }) {
  return (
    <Link href={href} aria-label="theParse home" style={{ display: "inline-flex" }}>
      <Image
        src="/images/logo/logo-2.png"
        alt="theParse: bespoke, innovative and scalable software"
        width={800}
        height={251}
        style={{ height, width: "auto" }}
        priority
      />
    </Link>
  );
}
