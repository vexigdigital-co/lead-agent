import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',       label: 'Dashboard',  icon: '⚡' },
  { to: '/leads',  label: 'Leads',      icon: '👥' },
  { to: '/chat',   label: 'Chat Demo',  icon: '💬' },
]

export function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-[#0d0d14] border-r border-white/5 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-sm">⚡</div>
          <span className="font-semibold text-white text-sm tracking-wide">LeadAgent</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-xs text-zinc-600">Phase 1 scaffold</p>
      </div>
    </aside>
  )
}
