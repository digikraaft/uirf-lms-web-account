import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';

const EditableField = (props) => {
  const {
    name,
    label,
    type,
    value,
    onChange,
    isEditable,
    ...others
  } = props;

  const id = `field-${name}`;

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(name, newValue); // Notify the parent of the change
  };

  return (
    <div className="form">
      <div className="relative">
        <label
          htmlFor={id}
          className="text-sm font-medium text-black"
        >
          {label}
        </label>
        <input
          className="w-full outline-none  border border-cFF0 focus:border-cFF0 focus:ring-1 focus:ring-cFF0 px-2 py-2 rounded  text-sm"
          name={name}
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          {...others}
        />
      </div>
    </div>
  );
};

EditableField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  isEditable: PropTypes.bool,
};

EditableField.defaultProps = {
  isEditable: true,
};

export default EditableField;