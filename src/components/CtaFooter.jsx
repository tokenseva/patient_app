export default function CtaFooter({ children }) {
  return (
    <div className="absolute left-0 right-0 bottom-0 px-5 box-border" style={{ paddingTop: 16 }}>
      <div className="w-full mx-auto flex flex-col" style={{ maxWidth: 430 }}>
        {children}
        <div style={{ height: 34 }} />
      </div>
    </div>
  );
}
