import type { ButtonHTMLAttributes } from 'react';

import type { ButtonVariant } from './button-variants';
import { getButtonClasses } from './button-variants';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button className={getButtonClasses(variant, className)} type={type} {...props} />;
}
