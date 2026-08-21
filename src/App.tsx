import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Bell, CalendarDays, Check, ChevronRight, CircleUserRound,
  Clock3, Dumbbell, Flame, GlassWater, History, Home, LockKeyhole,
  LogOut, MapPin, Menu, Moon, Pause, Pencil, Plus, Settings2, Sparkles,
  Star, Trophy, Waves, X, Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AuthScreen } from '@/components/AuthScreen';
import type { Session } from '@supabase/supabase-js';

type Screen = 'home' | 'schedule' | 'changes' | 'history' | 'profile';
type EventType = 'nap' | 'gym' | 'sports' | 'outing' | 'custom';
type EventItem = { id: string; type: EventType; label: string; time: string; detail: string };
type Reminder = { id: number; time: string; amount: number; status: 'done' | 'next' | 'upcoming' | 'paused' | 'boosted' | 'skipped'; reason?: string };
type AppState = { name: string; goal: number; consumed: number; streak: number; skips: number; events: EventItem[]; reminders: Reminder[]; history: { day: string; amount: number; target: number; status: string }[] };

const initialState: AppState = {
  name: '', goal: 2400, consumed: 0, streak: 6, skips: 0,
  events: [
    { id: 'gym-1', type: 'gym', label: 'Morning gym', time: '07:30 – 08:30', detail: '+300 ml activity boost' },
    { id: 'outing-1', type: 'outing', label: 'Client meeting', time: '13:00 – 15:00', detail: 'Reminders shifted around outing' },
  ],
  reminders: [
    { id: 1, time: '08:00', amount: 250, status: 'done' },
    { id: 2, time: '10:00', amount: 300, status: 'done' },
    { id: 3, time: '11:30', amount: 250, status: 'next' },
    { id: 4, time: '13:30', amount: 300, status: 'upcoming', reason: 'outing shift' },
    { id: 5, time: '15:30', amount: 300, status: 'upcoming' },
    { id: 6, time: '17:00', amount: 300, status: 'boosted', reason: 'gym boost' },
    { id: 7, time: '19:00', amount: 300, status: 'upcoming' },
    { id: 8, time: '21:00', amount: 200, status: 'upcoming' },
  ],
  history: [
    { day: 'Mon', amount: 2200, target: 2400, status: 'partial' },
    { day: 'Tue', amount: 2500, target: 2400, status: 'complete' },
    { day: 'Wed', amount: 1900, target: 2400, status: 'partial' },
    { day: 'Thu', amount: 2450, target: 2400, status: 'complete' },
    { day: 'Fri', amount: 2350, target: 2400, status: 'partial' },
    { day: 'Sat', amount: 2600, target: 2400, status: 'complete' },
    { day: 'Sun', amount: 1250, target: 2400, status: 'today' },
  ],
};

const eventMeta: Record<EventType, { label: string; icon: typeof Moon; detail: string }> = {
  nap: { label: 'Nap', icon: Moon, detail: 'Pause reminders while you rest' },
  gym: { label: 'Extra gym', icon: Dumbbell, detail: 'Boost hydration around training' },
  sports: { label: 'Sports', icon: Zap, detail: 'Add hydration for active movement' },
  outing: { label: 'Travel / outing', icon: MapPin, detail: 'Shift reminders around your plans' },
  custom: { label: 'Custom activity', icon: Star, detail: 'Add your own personal activity' },
};

function formatDate() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
}

function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [state, setState] = useState<AppState>(initialState);
  const [showReminder, setShowReminder] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setState(initialState);
    });
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    const load = async () => {
      if (!supabase || !userId) { setLoaded(true); return; }
      const { data, error } = await supabase
        .from('hydromind_demo_state')
        .select('state')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        console.error('Failed to load Hydrank state:', error.message);
        setLoaded(true);
        return;
      }
      if (data?.state && typeof data.state === 'object') {
        setState(data.state as AppState);
      } else {
        const fullName = (session?.user?.user_metadata?.full_name as string | undefined)?.trim();
        const fresh: AppState = { ...initialState, name: fullName || '' };
        setState(fresh);
        const { error: insertError } = await supabase
          .from('hydromind_demo_state')
          .insert({ user_id: userId, state: fresh, updated_at: new Date().toISOString() });
        if (insertError) console.error('Failed to create initial Hydrank state:', insertError.message);
      }
      setLoaded(true);
    };
    void load();
  }, [userId, session]);

  useEffect(() => {
    if (!loaded || !userId) return;
    const save = async () => {
      setSaving(true);
      if (supabase) {
        const { error } = await supabase
          .from('hydromind_demo_state')
          .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (error) console.error('Failed to save Hydrank state:', error.message);
      }
      setSaving(false);
    };
    const timeout = window.setTimeout(() => void save(), 500);
    return () => window.clearTimeout(timeout);
  }, [state, loaded, userId]);

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setState(initialState);
    setScreen('home');
  };

  const remaining = Math.max(state.goal - state.consumed, 0);
  const progress = Math.min((state.consumed / state.goal) * 100, 100);
  const nextReminder = state.reminders.find((reminder) => reminder.status === 'next');

  const updateReminder = (action: 'drank' | 'snooze' | 'skip') => {
    if (!nextReminder) return;
    setState((current) => {
      const reminders = current.reminders.map((reminder) => {
        if (reminder.id === nextReminder.id) {
          if (action === 'drank') return { ...reminder, status: 'done' as const };
          if (action === 'snooze') return { ...reminder, time: '11:45', status: 'next' as const, reason: 'snoozed 15m' };
          return { ...reminder, status: 'skipped' as const, reason: 'skipped' };
        }
        if (action !== 'snooze' && reminder.status === 'upcoming') return { ...reminder, status: 'next' as const };
        return reminder;
      });
      return {
        ...current,
        consumed: action === 'drank' ? current.consumed + nextReminder.amount : current.consumed,
        skips: action === 'skip' ? current.skips + 1 : current.skips,
        streak: action === 'skip' && current.skips >= 2 ? 0 : current.streak,
        reminders,
      };
    });
    setShowReminder(false);
    setNotice(action === 'drank' ? `${nextReminder.amount} ml logged. Nice work.` : action === 'snooze' ? 'Reminder moved 15 minutes.' : 'Reminder skipped. One follow-up will keep the plan moving.');
    window.setTimeout(() => setNotice(''), 3200);
  };

  const addEvent = (type: EventType, customLabel?: string) => {
    const meta = eventMeta[type];
    const label = type === 'custom' && customLabel ? customLabel : meta.label;
    const event: EventItem = { id: `${type}-${Date.now()}`, type, label, time: type === 'nap' ? '14:30 – 15:30' : type === 'sports' ? '18:00 – 19:00' : type === 'gym' ? '07:30 – 08:30' : type === 'custom' ? '12:00 – 13:00' : '13:00 – 15:00', detail: type === 'custom' ? 'Personal activity added to your plan' : meta.detail };
    setState((current) => ({ ...current, events: [...current.events, event], goal: current.goal + (type === 'gym' || type === 'sports' ? 300 : 0) }));
    setShowAddEvent(false);
    setNotice(`${label} added. Your schedule is adapting.`);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const removeEvent = (id: string) => {
    setState((current) => {
      const removed = current.events.find((event) => event.id === id);
      return {
        ...current,
        events: current.events.filter((event) => event.id !== id),
        goal: removed && (removed.type === 'gym' || removed.type === 'sports') ? Math.max(current.goal - 300, 0) : current.goal,
      };
    });
    setNotice('Change removed. Your plan has been updated.');
    window.setTimeout(() => setNotice(''), 3200);
  };

  if (!authReady) return <div className="loading-screen"><Waves size={28} /><span>Preparing your day</span></div>;
  if (!session) return <AuthScreen />;
  if (!loaded) return <div className="loading-screen"><Waves size={28} /><span>Preparing your day</span></div>;

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><GlassWater size={18} /></div><span>Hydrank</span></div>
        <div className="sidebar-rule" />
        <nav className="side-nav" aria-label="Main navigation">
          <NavButton active={screen === 'home'} icon={Home} label="Overview" onClick={() => setScreen('home')} />
          <NavButton active={screen === 'schedule'} icon={CalendarDays} label="Daily schedule" onClick={() => setScreen('schedule')} />
          <NavButton active={screen === 'changes'} icon={Zap} label="Today's changes" onClick={() => setScreen('changes')} badge={state.events.length} />
          <NavButton active={screen === 'history'} icon={History} label="History" onClick={() => setScreen('history')} />
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-profile"><div className="avatar">{state.name[0]}</div><div><strong>{state.name}</strong><span>Personal plan</span></div></div>
          <button className="settings-button" onClick={() => setScreen('profile')}><Settings2 size={17} /> Plan settings</button>
          <button className="settings-button signout" onClick={signOut}><LogOut size={17} /> Sign out</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setShowMobileMenu(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb">My day <ChevronRight size={14} /> <span>{screen === 'home' ? 'Overview' : screen === 'changes' ? "Today's changes" : screen === 'schedule' ? 'Daily schedule' : screen === 'history' ? 'History' : 'Plan settings'}</span></div><div className="top-actions"><span className="save-status">{saving ? 'Saving…' : 'Synced just now'}</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><button className="profile-chip" onClick={() => setScreen('profile')}><div className="avatar small">{state.name[0]}</div><span>{state.name}</span></button></div></header>

        {screen === 'home' && <HomeView state={state} progress={progress} remaining={remaining} nextReminder={nextReminder} onOpenReminder={() => setShowReminder(true)} onNavigate={setScreen} />}
        {screen === 'schedule' && <ScheduleView state={state} onOpenReminder={() => setShowReminder(true)} />}
        {screen === 'changes' && <ChangesView events={state.events} onAdd={() => setShowAddEvent(true)} onRemove={removeEvent} />}
        {screen === 'history' && <HistoryView state={state} />}
        {screen === 'profile' && <ProfileView state={state} setState={setState} onSignOut={signOut} />}
      </main>

      <div className="mobile-nav"><NavButton active={screen === 'home'} icon={Home} label="Home" onClick={() => setScreen('home')} /><NavButton active={screen === 'schedule'} icon={CalendarDays} label="Plan" onClick={() => setScreen('schedule')} /><NavButton active={screen === 'changes'} icon={Zap} label="Changes" onClick={() => setScreen('changes')} badge={state.events.length} /><NavButton active={screen === 'history'} icon={History} label="History" onClick={() => setScreen('history')} /><NavButton active={screen === 'profile'} icon={CircleUserRound} label="Profile" onClick={() => setScreen('profile')} /></div>
      {notice && <div className="toast"><Check size={17} /> {notice}</div>}
      {showReminder && nextReminder && <ReminderModal reminder={nextReminder} skips={state.skips} onClose={() => setShowReminder(false)} onAction={updateReminder} />}
      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onAdd={addEvent} />}
      {showMobileMenu && <MobileMenu state={state} current={screen} onNavigate={(s) => { setScreen(s); setShowMobileMenu(false); }} onClose={() => setShowMobileMenu(false)} onSignOut={signOut} />}
    </div>
  );
}

function NavButton({ active, icon: Icon, label, onClick, badge }: { active: boolean; icon: typeof Home; label: string; onClick: () => void; badge?: number }) {
  return <button className={`nav-button ${active ? 'active' : ''}`} onClick={onClick}><Icon size={19} /><span>{label}</span>{badge ? <b>{badge}</b> : null}</button>;
}

function HomeView({ state, progress, remaining, nextReminder, onOpenReminder, onNavigate }: { state: AppState; progress: number; remaining: number; nextReminder?: Reminder; onOpenReminder: () => void; onNavigate: (screen: Screen) => void }) {
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  return <div className="page page-home">
    <div className="page-intro"><div><p className="eyebrow">{formatDate()}</p><h1>{greeting}, {state.name}<span className="wave">.</span></h1><p className="muted">Your hydration plan is adapting to your day.</p></div><button className="outline-button" onClick={() => onNavigate('profile')}><Pencil size={15} /> Edit plan</button></div>
    <div className="hero-grid">
      <section className="card progress-card"><div className="card-top"><div><p className="eyebrow">Daily progress</p><h2>Stay in your flow</h2></div><div className="streak-pill"><Flame size={15} /> {state.streak} day streak</div></div><div className="progress-wrap"><div className="progress-orb" style={{ ['--progress' as string]: `${progress}%` }}><div className="orb-inner"><strong>{state.consumed.toLocaleString()}</strong><span>ml consumed</span></div></div><div className="progress-stats"><div><span>Suggested goal</span><strong>{state.goal.toLocaleString()} <small>ml</small></strong></div><div><span>Remaining</span><strong>{remaining.toLocaleString()} <small>ml</small></strong></div><div><span>Today’s pace</span><strong className="green">On track</strong></div></div></div><div className="card-footnote"><Sparkles size={14} /> Goal adjusted for your morning activity</div></section>
      <section className="card next-card"><div className="card-top"><div><p className="eyebrow">Up next</p><h2>Time to hydrate</h2></div><div className="live-dot"><span /> Ready</div></div><div className="next-time"><strong>{nextReminder?.time ?? '11:30'}</strong><span>in 24 min</span></div><div className="sip-row"><div className="sip-icon"><GlassWater size={19} /></div><div><strong>{nextReminder?.amount ?? 250} ml</strong><span>Planned for this moment</span></div><button className="primary-button compact" onClick={onOpenReminder}>Log water <ArrowRight size={16} /></button></div><p className="next-context"><Clock3 size={14} /> A gentle nudge based on your waking hours</p></section>
    </div>
    <div className="section-heading"><div><p className="eyebrow">Adaptive plan</p><h2>Today’s changes</h2></div><button className="text-button" onClick={() => onNavigate('changes')}>View all <ArrowRight size={15} /></button></div>
    <div className="event-grid">{state.events.slice(0, 3).map((event) => <EventCard key={event.id} event={event} />)}<button className="add-card" onClick={() => onNavigate('changes')}><div><Plus size={21} /></div><strong>Add a change</strong><span>Help your plan move with you</span></button></div>
    <div className="section-heading schedule-heading"><div><p className="eyebrow">Your rhythm</p><h2>Next on your schedule</h2></div><button className="text-button" onClick={() => onNavigate('schedule')}>Open schedule <ArrowRight size={15} /></button></div>
    <div className="mini-timeline">{state.reminders.slice(0, 4).map((reminder) => <TimelineRow key={reminder.id} reminder={reminder} />)}</div>
  </div>;
}

function EventCard({ event, onRemove }: { event: EventItem; onRemove?: (id: string) => void }) { const meta = eventMeta[event.type]; const Icon = meta.icon; return <div className={`event-card event-${event.type}`}><div className="event-icon"><Icon size={19} /></div><div><span>{event.time}</span><strong>{event.label}</strong><p>{event.detail}</p></div>{onRemove ? <button className="event-remove" onClick={() => onRemove(event.id)} aria-label={`Remove ${event.label}`}><X size={16} /></button> : <ChevronRight size={17} className="event-arrow" />}</div>; }

function TimelineRow({ reminder }: { reminder: Reminder }) { return <div className={`timeline-row row-${reminder.status}`}><div className="timeline-time">{reminder.time}</div><div className="timeline-dot">{reminder.status === 'done' ? <Check size={13} /> : reminder.status === 'paused' ? <Pause size={12} /> : <span />}</div><div className="timeline-info"><strong>{reminder.amount} ml</strong><span>{reminder.reason ?? (reminder.status === 'done' ? 'Completed' : reminder.status === 'next' ? 'Next reminder' : 'Planned')}</span></div>{reminder.status === 'next' && <span className="current-label">Now</span>}</div>; }

function ScheduleView({ state, onOpenReminder }: { state: AppState; onOpenReminder: () => void }) { return <div className="page"><div className="page-intro"><div><p className="eyebrow">Sunday, August 20</p><h1>Daily schedule</h1><p className="muted">A living plan built around your waking hours and today’s context.</p></div><button className="outline-button"><Bell size={15} /> Reminders on</button></div><div className="schedule-banner"><div className="banner-icon"><Sparkles size={20} /></div><div><strong>Your schedule has adapted</strong><span>Morning gym boosted your target. Client meeting shifted one reminder.</span></div><ChevronRight size={18} /></div><div className="schedule-layout"><div className="card full-schedule"><div className="schedule-header"><div><p className="eyebrow">Sunday plan</p><h2>8 hydration moments</h2></div><span className="schedule-total">{state.goal.toLocaleString()} ml total</span></div><div className="schedule-list">{state.reminders.map((reminder) => <button key={reminder.id} className={`schedule-item schedule-${reminder.status}`} onClick={reminder.status === 'next' ? onOpenReminder : undefined}><div className="schedule-time">{reminder.time}</div><div className="schedule-node">{reminder.status === 'done' ? <Check size={14} /> : reminder.status === 'paused' ? <Pause size={13} /> : <span />}</div><div className="schedule-detail"><strong>{reminder.amount} ml</strong><span>{reminder.status === 'done' ? 'Logged' : reminder.status === 'next' ? 'Ready when you are' : reminder.reason ?? 'Planned sip'}</span></div>{reminder.status === 'next' && <span className="action-tag">Take action <ArrowRight size={13} /></span>}{reminder.status === 'boosted' && <span className="reason-tag warm"><Zap size={12} /> Boosted</span>}{reminder.status === 'upcoming' && reminder.reason && <span className="reason-tag"><MapPin size={12} /> Shifted</span>}</button>)}</div></div><div className="side-stack"><div className="card explain-card"><div className="explain-icon"><Sparkles size={17} /></div><p className="eyebrow">Why this works</p><h3>Hydration that follows your life.</h3><p>Your plan distributes water gently across your waking window, then adjusts when your day changes.</p><div className="explain-line"><span /><div>Wake & sleep aware</div></div><div className="explain-line"><span /><div>Activity sensitive</div></div><div className="explain-line"><span /><div>No reminder stacking</div></div></div><div className="card locked-card"><LockKeyhole size={17} /><div><span>Coming soon</span><strong>Weekly insights</strong></div><ChevronRight size={16} /></div></div></div></div>; }

function ChangesView({ events, onAdd, onRemove }: { events: EventItem[]; onAdd: () => void; onRemove: (id: string) => void }) { return <div className="page"><div className="page-intro"><div><p className="eyebrow">Context-aware scheduling</p><h1>Today’s changes</h1><p className="muted">Tell Hydrank what your day looks like. Your plan will do the rest.</p></div><button className="primary-button" onClick={onAdd}><Plus size={17} /> Add a change</button></div><div className="active-changes"><div className="section-heading"><div><p className="eyebrow">Active today</p><h2>{events.length} changes shaping your plan</h2></div><span className="adjusted-chip"><Sparkles size={14} /> Plan adjusted</span></div>{events.length === 0 ? <div className="empty-changes"><Waves size={22} /><strong>No changes yet</strong><span>Add one below and your schedule will adapt.</span></div> : <div className="active-event-list">{events.map((event) => <EventCard key={event.id} event={event} onRemove={onRemove} />)}</div>}</div><div className="section-heading choose-heading"><div><p className="eyebrow">Quick add</p><h2>What’s happening?</h2></div></div><div className="change-options">{(Object.keys(eventMeta) as EventType[]).map((type) => { const meta = eventMeta[type]; const Icon = meta.icon; return <button className="change-option" key={type} onClick={() => onAdd()}><div className={`option-icon option-${type}`}><Icon size={21} /></div><div><strong>{meta.label}</strong><span>{meta.detail}</span></div><Plus size={17} /></button>; })}</div><div className="context-note"><Waves size={19} /><div><strong>Small changes, better timing.</strong><span>Hydrank never stacks missed water into one overwhelming moment. It gently redistributes your plan across the time you have.</span></div></div></div>; }

function HistoryView({ state }: { state: AppState }) { const average = Math.round(state.history.reduce((sum, item) => sum + item.amount, 0) / state.history.length); return <div className="page"><div className="page-intro"><div><p className="eyebrow">Your patterns</p><h1>History</h1><p className="muted">A kinder way to see your consistency over time.</p></div><button className="outline-button"><CalendarDays size={15} /> This week</button></div><div className="metrics-grid"><Metric label="7-day average" value={`${average.toLocaleString()} ml`} icon={Waves} tone="blue" /><Metric label="Best streak" value="12 days" icon={Trophy} tone="gold" /><Metric label="Skipped this week" value="250 ml" icon={Pause} tone="amber" /></div><div className="history-grid"><div className="card chart-card"><div className="card-top"><div><p className="eyebrow">Hydration rhythm</p><h2>This week</h2></div><span className="chart-legend"><i /> Goal <i className="legend-blue" /> Intake</span></div><div className="bar-chart">{state.history.map((item) => <div className="bar-col" key={item.day}><div className="bar-track"><div className={`bar-fill ${item.status}`} style={{ height: `${Math.min((item.amount / item.target) * 100, 100)}%` }} /><div className="goal-line" /></div><span>{item.day}</span></div>)}</div><div className="chart-foot"><span><b className="dot-mint" /> Goal 2,400 ml</span><span><b className="dot-blue" /> Average 2,250 ml</span></div></div><div className="card week-card"><p className="eyebrow">Consistency</p><h2>Keep your flow</h2><div className="consistency-ring"><strong>86%</strong><span>this week</span></div><p>You’re building a reliable rhythm. Your plan is working with your routine, not against it.</p><button className="text-button">View insights <ArrowRight size={15} /></button></div></div><div className="section-heading recent-heading"><div><p className="eyebrow">Recent activity</p><h2>Daily log</h2></div></div><div className="daily-log">{state.history.slice().reverse().map((item) => <div className="log-row" key={item.day}><div className="log-day"><strong>{item.day}</strong><span>{item.day === 'Sun' ? 'Today' : 'August'}</span></div><div className="log-progress"><div><span style={{ width: `${Math.min(item.amount / item.target * 100, 100)}%` }} /></div><small>{item.amount.toLocaleString()} / {item.target.toLocaleString()} ml</small></div><span className={`log-status ${item.status}`}>{item.status === 'complete' ? 'Complete' : item.status === 'today' ? 'In progress' : 'Almost there'}</span></div>)}</div></div>; }

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Waves; tone: string }) { return <div className="card metric-card"><div className={`metric-icon ${tone}`}><Icon size={18} /></div><span>{label}</span><strong>{value}</strong></div>; }

function ProfileView({ state, setState, onSignOut }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>>; onSignOut: () => void }) { return <div className="page"><div className="page-intro"><div><p className="eyebrow">Your preferences</p><h1>Plan settings</h1><p className="muted">Keep your suggestion aligned with the way you live.</p></div></div><div className="settings-layout"><div className="card settings-card"><div className="settings-heading"><div className="avatar large">{state.name[0]}</div><div><h2>{state.name}</h2><span>Personal hydration plan</span></div><button className="icon-button"><Pencil size={16} /></button></div><div className="form-grid"><label>First name<input value={state.name} onChange={(e) => setState((current) => ({ ...current, name: e.target.value }))} /></label><label>Suggested daily goal<input type="number" value={state.goal} onChange={(e) => setState((current) => ({ ...current, goal: Number(e.target.value) }))} /></label><label>Wake-up time<input type="time" defaultValue="07:00" /></label><label>Sleep time<input type="time" defaultValue="23:00" /></label></div><div className="settings-divider" /><div className="toggle-row"><div><strong>Adaptive reminders</strong><span>Let your schedule shift around naps, outings, and exercise.</span></div><div className="toggle on"><span /></div></div><div className="toggle-row"><div><strong>Gentle notifications</strong><span>Keep reminders supportive and limited.</span></div><div className="toggle on"><span /></div></div><button className="signout-button" onClick={onSignOut}><LogOut size={16} /> Sign out</button></div><div className="card premium-preview"><div className="premium-glow"><Sparkles size={20} /></div><p className="eyebrow">Future features</p><h2>More insight, when you’re ready.</h2><p>Unlock deeper weekly patterns, diet suggestions, and tailored plans in a future release.</p><div className="locked-list"><span><LockKeyhole size={14} /> Weight-loss plans</span><span><LockKeyhole size={14} /> Weekly analytics</span><span><LockKeyhole size={14} /> Diet suggestions</span></div><button className="outline-button">Notify me at launch</button></div></div></div>; }

function ReminderModal({ reminder, skips, onClose, onAction }: { reminder: Reminder; skips: number; onClose: () => void; onAction: (action: 'drank' | 'snooze' | 'skip') => void }) { return <div className="modal-backdrop"><div className="modal reminder-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="reminder-orb"><GlassWater size={27} /></div><p className="eyebrow">Reminder 3 of 8</p><h2>Time to hydrate</h2><strong className="modal-amount">{reminder.amount} ml</strong><p className="modal-copy">A small sip now keeps your energy steady through the afternoon.</p>{skips > 0 && <div className="skip-warning"><Pause size={15} /> One more skip pauses reminders for today.</div>}<button className="primary-button full" onClick={() => onAction('drank')}><Check size={18} /> I drank {reminder.amount} ml</button><div className="modal-actions"><button onClick={() => onAction('snooze')}><Clock3 size={16} /> Snooze 15m</button><button onClick={() => onAction('skip')}><X size={16} /> Skip</button></div></div></div>; }

function AddEventModal({ onClose, onAdd }: { onClose: () => void; onAdd: (type: EventType, customLabel?: string) => void }) { const [selected, setSelected] = useState<EventType>('nap'); const [customLabel, setCustomLabel] = useState(''); return <div className="modal-backdrop"><div className="modal add-modal"><button className="modal-close" onClick={onClose}><X size={18} /></button><p className="eyebrow">Adjust today</p><h2>What’s happening?</h2><p className="modal-copy">Your schedule will recalculate around this change.</p><div className="modal-event-options">{(Object.keys(eventMeta) as EventType[]).map((type) => { const meta = eventMeta[type]; const Icon = meta.icon; return <button className={selected === type ? 'selected' : ''} key={type} onClick={() => setSelected(type)}><Icon size={19} /><span>{meta.label}</span>{selected === type && <Check size={15} />}</button>; })}</div>{selected === 'custom' && <label className="custom-label">Activity name<input type="text" placeholder="e.g. Doctor appointment" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} required /></label>}<div className="time-inputs"><label>Starts<input type="time" defaultValue="14:30" /></label><label>Ends<input type="time" defaultValue="15:30" /></label></div><button className="primary-button full" onClick={() => onAdd(selected, customLabel)} disabled={selected === 'custom' && !customLabel.trim()}>Add to today <ArrowRight size={16} /></button></div></div>; }

function MobileMenu({ state, current, onNavigate, onClose, onSignOut }: { state: AppState; current: Screen; onNavigate: (screen: Screen) => void; onClose: () => void; onSignOut: () => void }) {
  const items: { screen: Screen; icon: typeof Home; label: string; badge?: number }[] = [
    { screen: 'home', icon: Home, label: 'Overview' },
    { screen: 'schedule', icon: CalendarDays, label: 'Daily schedule' },
    { screen: 'changes', icon: Zap, label: "Today's changes", badge: state.events.length },
    { screen: 'history', icon: History, label: 'History' },
    { screen: 'profile', icon: Settings2, label: 'Plan settings' },
  ];
  return (
    <div className="menu-backdrop" onClick={onClose}>
      <div className="mobile-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <div className="brand"><div className="brand-mark"><GlassWater size={18} /></div><span>Hydrank</span></div>
          <button className="panel-close" onClick={onClose} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="panel-profile">
          <div className="avatar large">{state.name[0]}</div>
          <div><strong>{state.name}</strong><span>Personal plan</span></div>
        </div>
        <nav className="panel-nav">
          {items.map(({ screen, icon: Icon, label, badge }) => (
            <button key={screen} className={`panel-item ${current === screen ? 'active' : ''}`} onClick={() => onNavigate(screen)}>
              <Icon size={19} /><span>{label}</span>{badge ? <b>{badge}</b> : null}
              {current === screen && <ChevronRight size={16} className="panel-arrow" />}
            </button>
          ))}
          <button className="panel-item signout" onClick={onSignOut}>
            <LogOut size={19} /><span>Sign out</span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default App;
