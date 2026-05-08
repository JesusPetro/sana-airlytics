export function EmptyWorkspace({ msg }: { msg: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(100vh - var(--topbar-h))',
      width: '100%',
      color: 'var(--color-text-secondary)',
      fontSize: '14px',
    }}>
      {msg}
    </div>
  );
}
