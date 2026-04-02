import * as React from "react"
import { cn } from "./utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    const [randomName] = React.useState(`field-${Math.random().toString(36).substring(7)}`);
    const [isReadOnly, setIsReadOnly] = React.useState(true);

    return (
      <textarea
        {...props}
        data-slot="textarea"
        data-form-type="other"
        name={props.name || randomName}
        id={props.id || randomName}
        autoComplete={props.autoComplete || "new-password"}
        spellCheck="false"
        autoCapitalize="off"
        readOnly={isReadOnly}
        onFocus={(e) => {
          setIsReadOnly(false);
          if (props.onFocus) props.onFocus(e);
        }}
        onBlur={(e) => {
          setIsReadOnly(true);
          if (props.onBlur) props.onBlur(e);
        }}
        className={cn(
          "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
