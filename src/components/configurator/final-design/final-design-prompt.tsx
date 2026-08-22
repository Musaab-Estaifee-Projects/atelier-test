"use client";

type Props = {
  open: boolean;
  onBack: () => void;
  onStart: () => void;
};

export default function FinalDesignPrompt({ open, onBack, onStart }: Props) {
  if (!open) return null;

  return (
    <div className="fd-overlay" role="dialog" aria-modal="true" aria-labelledby="fd-prompt-title">
      <div className="fd-modal fd-modal-prompt">
        <h2 id="fd-prompt-title" className="fd-prompt-title">
          Ready to prepare your final design?
        </h2>
        <p className="fd-prompt-copy">
          We’ll create final renders based on your selected materials and
          finishes. You’ll be able to review your design and prices before
          requesting your final quote.
        </p>
        <div className="fd-actions">
          <button type="button" className="fd-btn fd-btn-ghost" onClick={onBack}>
            Back to customize
          </button>
          <button type="button" className="fd-btn fd-btn-solid" onClick={onStart}>
            Start rendering
          </button>
        </div>
      </div>
    </div>
  );
}
