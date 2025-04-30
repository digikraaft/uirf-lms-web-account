import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { injectIntl, intlShape, FormattedMessage } from '@edx/frontend-platform/i18n';
import {
  Button, StatefulButton, Form,
} from '@openedx/paragon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faPencilAlt } from '@fortawesome/free-solid-svg-icons';

import Alert from './Alert';
import SwitchContent from './SwitchContent';
import messages from './AccountSettingsPage.messages';

import {
  openForm,
  closeForm,
} from './data/actions';
import { editableFieldSelector } from './data/selectors';

const EmailField = (props) => {
  const {
    name,
    label,
    emptyLabel,
    value,
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

  const renderConfirmationMessage = () => {
    if (!confirmationMessageDefinition || !confirmationValue) {
      return null;
    }
    return (
      <Alert
        className="alert-warning mt-n2"
        icon={<FontAwesomeIcon className="mr-2 h6" icon={faExclamationTriangle} />}
      >
        <h6 aria-level="3">
          {intl.formatMessage(messages['account.settings.email.field.confirmation.header'])}
        </h6>
        {intl.formatMessage(confirmationMessageDefinition, { value: confirmationValue })}
      </Alert>
    );
  };

  const renderEmptyLabel = () => {
    if (isEditable) {
      return <Button variant="link" onClick={onEdit} className="p-0">{emptyLabel}</Button>;
    }
    return <span className="text-muted">{emptyLabel}</span>;
  };

  return (
    <div className="form">
      <form onSubmit={handleSubmit}>
        <div className={`relative ${error ? 'is-invalid' : ''}`}>
          <label htmlFor={id} className="text-sm font-medium text-black ">
            {label}
          </label>
          <input
            className="w-full outline-none border border-cFF0 focus:border-cFF0 focus:ring-1 focus:ring-cFF0 px-2 py-2 rounded text-sm"
            name={name}
            id={id}
            type="email"
            value={inputValue}
            onChange={handleChange}
          />
          {!!helpText && <small className="form-text text-muted">{helpText}</small>}
          {error && <div className="invalid-feedback">{error}</div>}
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
      {renderConfirmationMessage()}
    </div>
  );
};

EmailField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  emptyLabel: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
  isEditable: PropTypes.bool,
  intl: intlShape.isRequired,
};

EmailField.defaultProps = {
  value: undefined,
  saveState: undefined,
  label: undefined,
  emptyLabel: undefined,
  error: undefined,
  confirmationMessageDefinition: undefined,
  confirmationValue: undefined,
  helpText: undefined,
  isEditable: true,
};

export default connect(editableFieldSelector, {
  onEdit: openForm,
  onCancel: closeForm,
})(injectIntl(EmailField));
