interface Props {
  open: boolean;
  onClose: () => void;
}

export function HelpOverlay({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="man-title"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape" || e.key === "q") onClose();
      }}
    >
      <div
        className="manpage"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 id="man-title">TELETYPE(1)                    User Commands</h1>
        <p className="section-name">NAME</p>
        <p>teletype — retro terminal typing practice and races</p>

        <h2>SYNOPSIS</h2>
        <p>teletype [--mode time|words|quote] [--theme THEME]</p>

        <h2>DESCRIPTION</h2>
        <p>
          teletype is a typing trainer with the aesthetic of a Linux TTY and
          manpages. Type the presented text; live WPM and accuracy update as
          you go. Guest results are stored in localStorage.
        </p>

        <h2>MODES</h2>
        <ul>
          <li>
            <strong>time</strong> — type for 15, 30, or 60 seconds
          </li>
          <li>
            <strong>words</strong> — complete 10, 25, 50, or 100 words
          </li>
          <li>
            <strong>quote</strong> — type a short curated quote
          </li>
        </ul>

        <h2>KEYBINDINGS</h2>
        <ul>
          <li>
            <kbd>Tab</kbd> + <kbd>Enter</kbd> — restart (or use restart button)
          </li>
          <li>
            <kbd>Esc</kbd> / <kbd>q</kbd> — close this manual
          </li>
          <li>
            <kbd>?</kbd> — open this manual
          </li>
        </ul>

        <h2>FILES</h2>
        <p>localStorage: teletype:guest-results, teletype:theme</p>

        <h2>SEE ALSO</h2>
        <p>monkeytype(1), typeracer(1), man(1), tty(4)</p>

        <p style={{ marginTop: "1.25rem", color: "var(--fg-muted)" }}>
          Press q or Esc to quit.
        </p>
      </div>
    </div>
  );
}
