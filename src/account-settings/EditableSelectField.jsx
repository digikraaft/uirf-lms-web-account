import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import {
  Button, Form, StatefulButton,
} from '@openedx/paragon';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import SwitchContent from './SwitchContent';
import messages from './AccountSettingsPage.messages';

import {
  openForm,
  closeForm,
} from './data/actions';
import { editableFieldSelector } from './data/selectors';
import CertificatePreference from './certificate-preference/CertificatePreference';

const EditableSelectField = (props) => {
  const {
    name,
    label,
    emptyLabel,
    type,
    value,
    userSuppliedValue,
    options,
    saveState,
    error,
    confirmationMessageDefinition,
    confirmationValue,
    helpText,
    onEdit,
    onCancel,
    onSubmit,
    onChange,
    isEditable,
    intl,
    ...others
  } = props;

  const [isButtonVisible, setIsButtonVisible] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || '');

  const id = `field-${name}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(name, inputValue);
    setIsButtonVisible(false); // Hide buttons after successful save
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue !== value) {
      setIsButtonVisible(true); // Show buttons when input is edited
    } else {
      setIsButtonVisible(false); // Hide buttons if input matches the original value
    }
    onChange(name, newValue);
  };

  const handleCancel = () => {
    setInputValue(value); // Reset input to original value
    setIsButtonVisible(false); // Hide buttons
    onCancel(name);
  };

  const renderEmptyLabel = () => {
    if (isEditable) {
      return <Button variant="link" onClick={onEdit} className="p-0">{emptyLabel}</Button>;
    }
    return <span className="text-muted">{emptyLabel}</span>;
  };

  const renderValue = (rawValue) => {
    if (!rawValue) {
      return renderEmptyLabel();
    }
    let finalValue = rawValue;

    if (options) {
      const selectedOption = options.find(option => option.value == rawValue); // eslint-disable-line eqeqeq
      if (selectedOption) {
        finalValue = selectedOption.label;
      }
    }

    if (userSuppliedValue) {
      finalValue += `: ${userSuppliedValue}`;
    }

    return finalValue;
  };

  const selectOptions = options.map((option) => {
    if (option.group) {
      return (
        <optgroup label={option.label} key={option.label}>
          {option.group.map((subOption) => (
            <option
              value={subOption.value}
              key={`${subOption.value}-${subOption.label}`}
              disabled={subOption?.disabled}
            >
              {subOption.label}
            </option>
          ))}
        </optgroup>
      );
    }
    return (
      <option value={option.value} key={`${option.value}-${option.label}`} disabled={option?.disabled}>
        {option.label}
      </option>
    );
  });

  return (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className={`relative ${error ? 'is-invalid' : ''}`}>
          <label htmlFor={id} className="text-sm font-medium text-black">
            {label}
          </label>
          <select
            className="w-full outline-none border border-cFF0 focus:border-cFF0 focus:ring-1 focus:ring-cFF0 px-2 py-2 rounded text-sm"
            name={name}
            id={id}
            value={inputValue}
            onChange={handleChange}
            {...others}
          >
            {options.length > 0 && selectOptions}
          </select>
          {!!helpText && <small className="form-text text-muted">{helpText}</small>}
          {error && <div className="invalid-feedback">{error}</div>}
          {others.children}
        </div>
        {isButtonVisible && (
          <div className="mt-3">
            <StatefulButton
              type="submit"
              className="mr-2 bg-cFF0 text-white border-none outline-none hover:bg-cFF0 hover:bg-opacity-85"
              state={saveState}
              labels={{
                default: intl.formatMessage(messages['account.settings.editable.field.action.save']),
              }}
              onClick={(e) => {
                if (saveState === 'pending') {
                  e.preventDefault();
                }
              }}
              disabledStates={[]}
            />
            <Button variant="outline-primary" onClick={handleCancel}>
              {intl.formatMessage(messages['account.settings.editable.field.action.cancel'])}
            </Button>
          </div>
        )}
      </form>
      {['name', 'verified_name'].includes(name) && <CertificatePreference fieldName={name} />}
    </div>
  );
};

EditableSelectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]),
  emptyLabel: PropTypes.node,
  type: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userSuppliedValue: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })),
  saveState: PropTypes.oneOf(['default', 'pending', 'complete', 'error']),
  error: PropTypes.string,
  confirmationMessageDefinition: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    description: PropTypes.string,
  }),
  confirmationValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  helpText: PropTypes.node,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  isEditable: PropTypes.bool,
  isGrayedOut: PropTypes.bool,
  intl: intlShape.isRequired,
};

EditableSelectField.defaultProps = {
  value: undefined,
  options: [],
  saveState: undefined,
  label: undefined,
  emptyLabel: undefined,
  error: undefined,
  confirmationMessageDefinition: undefined,
  confirmationValue: undefined,
  helpText: undefined,
  isEditing: false,
  isEditable: true,
  isGrayedOut: false,
  userSuppliedValue: undefined,
};

export default connect(editableFieldSelector, {
  onEdit: openForm,
  onCancel: closeForm,
})(injectIntl(EditableSelectField));
