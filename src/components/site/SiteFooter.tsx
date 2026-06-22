import { Github, Linkedin, Mail, Coffee } from "lucide-react";

const SOCIAL = [
  { href: "https://github.com/derekyuan1000", icon: Github, label: "GitHub", external: true },
  {
    href: "https://www.linkedin.com/in/derek-yuan-6900a6406/",
    icon: Linkedin,
    label: "LinkedIn",
    external: true,
  },
  { href: "mailto:contact@derekyuan.co.uk", icon: Mail, label: "Email", external: false },
  { href: "https://ko-fi.com/derekyuan", icon: Coffee, label: "Ko-fi", external: true },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-hairline py-10 text-center text-[14px] text-muted-ink">
      <p className="text-[20px] font-semibold text-ink mb-4">Derek Yuan</p>

      <div className="flex justify-center gap-6 mb-4">
        {SOCIAL.map(({ href, icon: Icon, label, external }) => (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            title={label}
            className="text-body-ink hover:text-ink transition-colors"
          >
            <Icon width={20} height={20} aria-hidden="true" />
          </a>
        ))}
      </div>

      <p>© {new Date().getFullYear()} Derek Yuan. All rights reserved.</p>
      <p className="mt-2 text-[12px]">
        <a
          href="https://www.derekyuan.co.uk"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-body-ink transition-colors"
        >
          derekyuan.co.uk
        </a>
      </p>
    </footer>
  );
}
