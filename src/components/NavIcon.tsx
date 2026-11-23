type NavIconName =
  | 'home'
  | 'accounts'
  | 'calculator'
  | 'feasibility'
  | 'csp'
  | 'assets'
  | 'open'
  | 'closed'
  | 'notifications'
  | 'settings'

const paths: Record<NavIconName, JSX.Element> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </>
  ),
  accounts: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 11h18M7 15h2M7 17h4" />
    </>
  ),
  calculator: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h2M8 15h2M12 15h2M16 15h2" />
    </>
  ),
  feasibility: (
    <>
      <path d="M12 3v18M3 12h18" />
      <circle cx="7" cy="7" r="2" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  csp: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M12 8v8M9 13l3 3 3-3" />
    </>
  ),
  assets: (
    <>
      <path d="M3 17 9 11 13 15 21 7" />
      <path d="M14 7h7v7" />
    </>
  ),
  open: (
    <>
      <path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
      <path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
      <path d="M4 12h16" />
    </>
  ),
  closed: (
    <>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
}

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
