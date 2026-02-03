import { forwardRef } from 'react';

import styles from './Label.module.css';

import type { LabelHTMLAttributes} from 'react';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`${styles.label} ${className || ''}`}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';
