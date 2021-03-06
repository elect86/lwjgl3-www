import { useRef } from 'react';
import uniqueId from 'lodash-es/uniqueId';
import { cx } from '@emotion/css';

interface Props {
  label: string;
  value?: any;
  onChange: (value: any) => void;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  toggle?: boolean;
  icon?: React.ReactNode;
}

export const Checkbox: React.FC<Props> = ({
  label,
  value,
  onChange,
  checked = false,
  disabled = false,
  hidden = false,
  toggle = false,
  icon,
}) => {
  const htmlForId = useRef(uniqueId('checkbox'));

  return hidden === true ? null : (
    <div className={cx('custom-control', toggle === true ? 'custom-switch' : 'custom-checkbox')}>
      <input
        type="checkbox"
        id={htmlForId.current}
        className="custom-control-input"
        disabled={disabled}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <label className="custom-control-label" htmlFor={htmlForId.current}>
        {icon}
        {icon != null ? ' ' : null}
        {label}
      </label>
    </div>
  );
};
