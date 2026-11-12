"use client";

import { useRouter } from "next/navigation";

/**
 * A table row that opens `href` when clicked anywhere. The row's first cell should
 * still contain a real <Link> to the same place, for keyboard and screen-reader users.
 * Clicks on links, buttons and form fields inside the row are left alone.
 */
export default function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <tr
      className="pt-dt-rowlink"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a,button,input,select,textarea,label")) return;
        if (window.getSelection()?.toString()) return; // let people select text
        if (e.metaKey || e.ctrlKey) window.open(href, "_blank");
        else router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
