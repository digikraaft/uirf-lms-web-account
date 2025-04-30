import { AppContext } from '@edx/frontend-platform/react';
import { getConfig, getQueryParameters } from '@edx/frontend-platform';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import memoize from 'memoize-one';
import findIndex from 'lodash.findindex';
import { sendTrackingLogEvent } from '@edx/frontend-platform/analytics';
import {
  injectIntl,
  intlShape,
  FormattedMessage,
  getCountryList,
  getLanguageList,
} from '@edx/frontend-platform/i18n';
import {
  Hyperlink, Icon, Alert, Button, StatefulButton
} from '@openedx/paragon';
import { CheckCircle, Error, WarningFilled } from '@openedx/paragon/icons';

import messages from './AccountSettingsPage.messages';
import {
  fetchSettings,
  saveMultipleSettings,
  saveSettings,
  updateDraft,
  beginNameChange,
} from './data/actions';
import { accountSettingsPageSelector } from './data/selectors';
import PageLoading from './PageLoading';
import EditableField from './EditableField';
import EditableSelectField from './EditableSelectField';
import ResetPassword from './reset-password';
import NameChange from './name-change';
import EmailField from './EmailField';
import OneTimeDismissibleAlert from './OneTimeDismissibleAlert';
import DOBModal from './DOBForm';
import {
  YEAR_OF_BIRTH_OPTIONS,
  EDUCATION_LEVELS,
  GENDER_OPTIONS,
  getStatesList,
  FIELD_LABELS,
} from './data/constants';
import { fetchSiteLanguages } from './site-language';
import { fetchCourseList } from '../notification-preferences/data/thunks';
import { withLocation, withNavigate } from './hoc';
import DeleteAccount from './delete-account/DeleteAccount';

class AccountSettingsPage extends React.Component {
  constructor(props, context) {
    super(props, context);

    const duplicateTpaProvider = getQueryParameters().duplicate_provider;
    this.state = {
      duplicateTpaProvider,
      showNameButtons: false,
      initialNameValues: null
    };

    this.navLinkRefs = {
      '#basic-information': React.createRef(),
      '#profile-information': React.createRef(),
      '#social-media': React.createRef(),
      '#notifications': React.createRef(),
      '#site-preferences': React.createRef(),
      '#linked-accounts': React.createRef(),
      '#delete-account': React.createRef(),
    };
  }

  componentDidMount() {
    this.props.fetchCourseList();
    this.props.fetchSettings();
    this.props.fetchSiteLanguages(this.props.navigate);
    sendTrackingLogEvent('edx.user.settings.viewed', {
      page: 'account',
      visibility: null,
      user_id: this.context.authenticatedUser.userId,
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.loading && !prevProps.loaded && this.props.loaded) {
      const locationHash = global.location.hash;
      if (typeof locationHash !== 'string') {
        return;
      }
      if (Object.keys(this.navLinkRefs).includes(locationHash) && this.navLinkRefs[locationHash].current) {
        window.scrollTo(0, this.navLinkRefs[locationHash].current.offsetTop);
      }
    }

    if (!prevProps.loaded && this.props.loaded && this.props.formValues.name && !this.state.initialNameValues) {
      const nameParts = this.props.formValues.name.split(' ');
      this.setState({
        initialNameValues: {
          firstName: nameParts[0] || '',
          middleName: nameParts.length > 2 ? nameParts[1] : '',
          lastName: nameParts.length > 1 ? nameParts.slice(-1)[0] : ''
        }
      });
    }
  }

  handleNameFieldChange = (field, value) => {
    const { formValues } = this.props;
    
    if (!this.state.initialNameValues) {
      const nameParts = formValues.name.split(' ');
      this.setState({
        initialNameValues: {
          firstName: nameParts[0] || '',
          middleName: nameParts.length > 2 ? nameParts[1] : '',
          lastName: nameParts.length > 1 ? nameParts.slice(-1)[0] : ''
        }
      });
    }

    this.props.updateDraft(field, value);
    
    const currentValues = {
      firstName: field === 'firstName' ? value : formValues.firstName || '',
      middleName: field === 'middleName' ? value : formValues.middleName || '',
      lastName: field === 'lastName' ? value : formValues.lastName || ''
    };
    
    const hasChanges = this.state.initialNameValues && (
      currentValues.firstName !== this.state.initialNameValues.firstName ||
      currentValues.middleName !== this.state.initialNameValues.middleName ||
      currentValues.lastName !== this.state.initialNameValues.lastName
    );
    
    this.setState({ showNameButtons: hasChanges });
  };

  handleSaveNames = () => {
    const { formValues } = this.props;
    
    const fullName = [
      formValues.firstName || '',
      formValues.middleName || '',
      formValues.lastName || ''
    ].filter(name => name.trim() !== '').join(' ');

    this.handleSubmitProfileName('name', fullName);
    
    this.setState({
      showNameButtons: false,
      initialNameValues: {
        firstName: formValues.firstName || '',
        middleName: formValues.middleName || '',
        lastName: formValues.lastName || ''
      }
    });
  };

  handleCancelNames = () => {
    const { initialNameValues } = this.state;
    
    if (initialNameValues) {
      this.props.updateDraft('firstName', initialNameValues.firstName);
      this.props.updateDraft('middleName', initialNameValues.middleName);
      this.props.updateDraft('lastName', initialNameValues.lastName);
    }
    
    this.setState({
      showNameButtons: false
    });
  };

  getLocalizedTimeZoneOptions = memoize((timeZoneOptions, countryTimeZoneOptions, locale) => {
    const concatTimeZoneOptions = [{
      label: this.props.intl.formatMessage(messages['account.settings.field.time.zone.default']),
      value: '',
    }];
    if (countryTimeZoneOptions.length) {
      concatTimeZoneOptions.push({
        label: this.props.intl.formatMessage(messages['account.settings.field.time.zone.country']),
        group: countryTimeZoneOptions,
      });
    }
    concatTimeZoneOptions.push({
      label: this.props.intl.formatMessage(messages['account.settings.field.time.zone.all']),
      group: timeZoneOptions,
    });
    return concatTimeZoneOptions;
  });

  getLocalizedOptions = memoize((locale, country) => ({
    countryOptions: [{
      value: '',
      label: this.props.intl.formatMessage(messages['account.settings.field.country.options.empty']),
    }].concat(
      this.removeDisabledCountries(
        getCountryList(locale).map(({ code, name }) => ({
          value: code,
          label: name,
          disabled: this.isDisabledCountry(code),
        })),
      ),
    ),
    stateOptions: [{
      value: '',
      label: this.props.intl.formatMessage(messages['account.settings.field.state.options.empty']),
    }].concat(getStatesList(country)),
    yearOfBirthOptions: [{
      value: '',
      label: this.props.intl.formatMessage(messages['account.settings.field.year_of_birth.options.empty']),
    }].concat(YEAR_OF_BIRTH_OPTIONS),
    educationLevelOptions: EDUCATION_LEVELS.map(key => ({
      value: key,
      label: this.props.intl.formatMessage(messages[`account.settings.field.education.levels.${key || 'empty'}`]),
    })),
    genderOptions: GENDER_OPTIONS.map(key => ({
      value: key,
      label: this.props.intl.formatMessage(messages[`account.settings.field.gender.options.${key || 'empty'}`]),
    })),
  }));

  canDeleteAccount = () => {
    const { committedValues } = this.props;
    return !getConfig().COUNTRIES_WITH_DELETE_ACCOUNT_DISABLED.includes(committedValues.country);
  };

  handleEditableFieldChange = (name, value) => {
    this.props.updateDraft(name, value);
  };

  handleSubmit = (formId, values) => {
    if (formId === FIELD_LABELS.COUNTRY && this.isDisabledCountry(values)) {
      return;
    }
    this.props.saveSettings(formId, values);
  };

  handleSubmitProfileName = (formId, values) => {
    if (Object.keys(this.props.drafts).includes('useVerifiedNameForCerts')) {
      this.props.saveMultipleSettings([
        {
          formId,
          commitValues: values,
        },
        {
          formId: 'useVerifiedNameForCerts',
          commitValues: this.props.formValues.useVerifiedNameForCerts,
        },
      ], formId);
    } else {
      this.props.saveSettings(formId, values);
    }
  };

  isDisabledCountry = (country) => {
    const { countriesCodesList } = this.props;
    return countriesCodesList.length > 0 && !countriesCodesList.find(x => x === country);
  };

  removeDisabledCountries = (countryList) => {
    const { countriesCodesList, committedValues } = this.props;
    const committedCountry = committedValues?.country;
    if (!countriesCodesList.length) {
      return countryList;
    }
    return countryList.filter(({ value }) => value === committedCountry || countriesCodesList.find(x => x === value));
  };

  isEditable(fieldName) {
    return !this.props.staticFields.includes(fieldName);
  }

  renderEmptyStaticFieldMessage() {
    return this.props.intl.formatMessage(messages['account.settings.static.field.empty.no.admin']);
  }

    renderFullNameHelpText = (status, proctoredExamId) => {
      if (!this.props.verifiedNameHistory) {
        return this.props.intl.formatMessage(messages['account.settings.field.full.name.help.text']);
      }
  
      let messageString = 'account.settings.field.full.name.help.text';
  
      if (status === 'submitted') {
        messageString += '.submitted';
        if (proctoredExamId) {
          messageString += '.proctored';
        }
      } else {
        messageString += '.default';
      }
  
      if (!this.props.committedValues.useVerifiedNameForCerts) {
        messageString += '.certificate';
      }
  
      return this.props.intl.formatMessage(messages[messageString]);
    };
  
    renderVerifiedNameSuccessMessage = (verifiedName, created) => {
      const dateValue = new Date(created).valueOf();
      const id = `dismissedVerifiedNameSuccessMessage-${verifiedName}-${dateValue}`;
  
      return (
        <OneTimeDismissibleAlert
          id={id}
          variant="success"
          icon={CheckCircle}
          header={this.props.intl.formatMessage(messages['account.settings.field.name.verified.success.message.header'])}
          body={this.props.intl.formatMessage(messages['account.settings.field.name.verified.success.message'])}
        />
      );
    };
  
    renderVerifiedNameFailureMessage = (verifiedName, created) => {
      const dateValue = new Date(created).valueOf();
      const id = `dismissedVerifiedNameFailureMessage-${verifiedName}-${dateValue}`;
  
      return (
        <OneTimeDismissibleAlert
          id={id}
          variant="danger"
          icon={Error}
          header={this.props.intl.formatMessage(messages['account.settings.field.name.verified.failure.message.header'])}
          body={
            (
              <div className="d-flex flex-row">
                {this.props.intl.formatMessage(messages['account.settings.field.name.verified.failure.message'])}
              </div>
            )
          }
        />
      );
    };
  
    renderVerifiedNameSubmittedMessage = (willCertNameChange) => (
      <Alert
        variant="warning"
        icon={WarningFilled}
      >
        <Alert.Heading>
          {this.props.intl.formatMessage(messages['account.settings.field.name.verified.submitted.message.header'])}
        </Alert.Heading>
        <p>
          {this.props.intl.formatMessage(messages['account.settings.field.name.verified.submitted.message'])}{' '}
          {
            willCertNameChange
            && this.props.intl.formatMessage(messages['account.settings.field.name.verified.submitted.message.certificate'])
          }
        </p>
      </Alert>
    );
  
    renderVerifiedNameMessage = verifiedNameRecord => {
      const {
        created,
        status,
        profile_name: profileName,
        verified_name: verifiedName,
        proctored_exam_attempt_id: proctoredExamId,
      } = verifiedNameRecord;
      let willCertNameChange = false;
  
      if (
        (
          // User submitted a profile name change, and uses their profile name on certificates
          this.props.committedValues.name !== profileName
          && !this.props.committedValues.useVerifiedNameForCerts
        )
        || (
          // User submitted a verified name change, and uses their verified name on certificates
          this.props.committedValues.name === profileName
          && this.props.committedValues.useVerifiedNameForCerts
        )
      ) {
        willCertNameChange = true;
      }
  
      if (proctoredExamId) {
        return null;
      }
  
      switch (status) {
        case 'approved':
          return this.renderVerifiedNameSuccessMessage(verifiedName, created);
        case 'denied':
          return this.renderVerifiedNameFailureMessage(verifiedName, created);
        case 'submitted':
          return this.renderVerifiedNameSubmittedMessage(willCertNameChange);
        default:
          return null;
      }
    };
  
    renderVerifiedNameIcon = (status) => {
      switch (status) {
        case 'approved':
          return (<Icon src={CheckCircle} className="ml-1" style={{ height: '18px', width: '18px', color: 'green' }} />);
        case 'submitted':
          return (<Icon src={WarningFilled} className="ml-1" style={{ height: '18px', width: '18px', color: 'yellow' }} />);
        default:
          return null;
      }
    };
  
    renderVerifiedNameHelpText = (status, proctoredExamId) => {
      let messageStr = 'account.settings.field.name.verified.help.text';
  
      // add additional string based on status
      if (status === 'approved') {
        messageStr += '.verified';
      } else if (status === 'submitted') {
        messageStr += '.submitted';
      } else {
        return null;
      }
  
      // add additional string if verified name came from a proctored exam attempt
      if (proctoredExamId) {
        messageStr += '.proctored';
      }
  
      // add additional string based on certificate name use
      if (this.props.committedValues.useVerifiedNameForCerts) {
        messageStr += '.certificate';
      }
  
      return this.props.intl.formatMessage(messages[messageStr]);
    };
  
    // renderEmptyStaticFieldMessage() {
    //   if (this.isManagedProfile()) {
    //     return this.props.intl.formatMessage(messages['account.settings.static.field.empty'], {
    //       enterprise: this.props.profileDataManager,
    //     });
    //   }
    //   return this.props.intl.formatMessage(messages['account.settings.static.field.empty.no.admin']);
    // }
  
    renderNameChangeModal() {
      if (this.props.nameChangeModal && this.props.nameChangeModal.formId) {
        return <NameChange targetFormId={this.props.nameChangeModal.formId} />;
      }
      return null;
    }
  
    renderSecondaryEmailField(editableFieldProps) {
      if (!this.props.formValues.secondary_email_enabled) {
        return null;
      }
  
      return (
        <EmailField
          name="secondary_email"
          label={this.props.intl.formatMessage(messages['account.settings.field.secondary.email'])}
          emptyLabel={this.props.intl.formatMessage(messages['account.settings.field.secondary.email.empty'])}
          value={this.props.formValues.secondary_email}
          confirmationMessageDefinition={messages['account.settings.field.secondary.email.confirmation']}
          {...editableFieldProps}
        />
      );
    }

  renderContent() {
    const editableFieldProps = {
      onChange: this.handleEditableFieldChange,
      onSubmit: this.handleSubmit,
    };

    const {
      countryOptions,
      yearOfBirthOptions,
    } = this.getLocalizedOptions(this.context.locale, this.props.formValues.country);

    const timeZoneOptions = this.getLocalizedTimeZoneOptions(
      this.props.timeZoneOptions,
      this.props.countryTimeZoneOptions,
      this.context.locale,
    );

    const hasLinkedTPA = findIndex(this.props.tpaProviders, provider => provider.connected) >= 0;

    const shouldUpdateDOB = (
      getConfig().ENABLE_COPPA_COMPLIANCE &&
      getConfig().ENABLE_DOB_UPDATE &&
      this.props.formValues.year_of_birth.toString() >= COPPA_COMPLIANCE_YEAR.toString() &&
      !localStorage.getItem('submittedDOB')
    );

    return (
      <div className="w-full">
        {shouldUpdateDOB && <DOBModal {...editableFieldProps} />}
        <div className="w-full pt-20 lg:px-20 px-4 md:px-10">
          <div className="w-full xl:w-4/5 2xl:w-3/5">
            <h2 className="xl:text-3xl font-semibold text-xl lg:text-2xl text-black mt-4">
              {this.props.intl.formatMessage(messages['account.settings.section.account.information'])}
            </h2>
            <div className="w-full py-1 mt-2.5">
              {/* Name Fields */}
              <div>
                <div className='w-full flex flex-wrap gap-4'>
                  <div className='flex-1 min-w-[200px]'>
                    <EditableField
                      name="firstName"
                      type="text"
                      value={this.props.formValues.firstName || ''}
                      label={this.props.intl.formatMessage(messages['account.settings.field.full.name'])}
                      emptyLabel={this.renderEmptyStaticFieldMessage()}
                      isEditable={this.isEditable('name')}
                      onChange={this.handleNameFieldChange}
                    />
                  </div>
                  <div className='flex-1 min-w-[200px]'>
                    <EditableField
                      name="middleName"
                      type="text"
                      value={this.props.formValues.middleName || ''}
                      label={this.props.intl.formatMessage(messages['account.settings.field.middle.name'])}
                      emptyLabel={this.renderEmptyStaticFieldMessage()}
                      isEditable={this.isEditable('name')}
                      onChange={this.handleNameFieldChange}
                    />
                  </div>
                  <div className='flex-1 min-w-[200px]'>
                    <EditableField
                      name="lastName"
                      type="text"
                      value={this.props.formValues.lastName || ''}
                      label={this.props.intl.formatMessage(messages['account.settings.field.last.name'])}
                      emptyLabel={this.renderEmptyStaticFieldMessage()}
                      isEditable={this.isEditable('name')}
                      onChange={this.handleNameFieldChange}
                    />
                  </div>
                </div>
                <div className='mt-2.5'>
                  {this.state.showNameButtons && (
                    <div className="flex gap-3">
                      <StatefulButton
                        type="button"
                        classNam="bg-cFF0 text-white border-none outline-none hover:bg-cFF0 hover:bg-opacity-85"
                        state={this.props.saveState}
                        labels={{
                          default: this.props.intl.formatMessage(messages['account.settings.editable.field.action.save']),
                          pending: this.props.intl.formatMessage(messages['account.settings.editable.field.action.saving']),
                          complete: this.props.intl.formatMessage(messages['account.settings.editable.field.action.saved']),
                        }}
                        onClick={this.handleSaveNames}
                        className="mr-2"
                      />
                      <Button 
                        variant="outline-primary" 
                        onClick={this.handleCancelNames}
                      >
                        {this.props.intl.formatMessage(messages['account.settings.editable.field.action.cancel'])}
                      </Button>
                    </div>
                  )}
                  <div className="text-sm font-normal text-[#6B6B6B] font-poppins">
                    {this.props.intl.formatMessage(messages['account.settings.field.full.name.help.text'])}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className='mt-4'>
                <EmailField
                  name="email"
                  label={this.props.intl.formatMessage(messages['account.settings.field.email'])}
                  emptyLabel={this.renderEmptyStaticFieldMessage()}
                  value={this.props.formValues.email}
                  confirmationMessageDefinition={messages['account.settings.field.email.confirmation']}
                  helpText={this.props.intl.formatMessage(
                    messages['account.settings.field.email.help.text'],
                    { siteName: getConfig().SITE_NAME },
                  )}
                  isEditable={this.isEditable('email')}
                  {...editableFieldProps}
                />
              </div>

              {/* DOB and Country */}
              <div className='flex flex-wrap gap-4 mt-4'>
                {!getConfig().ENABLE_COPPA_COMPLIANCE && (
                  <EditableSelectField
                    name="year_of_birth"
                    type="select"
                    label={this.props.intl.formatMessage(messages['account.settings.field.dob'])}
                    emptyLabel={this.props.intl.formatMessage(messages['account.settings.field.dob.empty'])}
                    value={this.props.formValues.year_of_birth}
                    options={yearOfBirthOptions}
                    {...editableFieldProps}
                  />
                )}
                <EditableSelectField
                  name="country"
                  type="select"
                  value={this.props.formValues.country}
                  options={countryOptions}
                  label={this.props.intl.formatMessage(messages['account.settings.field.country'])}
                  emptyLabel={this.renderEmptyStaticFieldMessage()}
                  isEditable={this.isEditable('country')}
                  {...editableFieldProps}
                />
              </div>

              {/* Language and Time zone */}
              <div className='flex flex-wrap gap-4 mt-4'>
                <EditableSelectField
                  name="siteLanguage"
                  type="select"
                  options={this.props.siteLanguageOptions}
                  value={this.props.siteLanguage.draft !== undefined ? this.props.siteLanguage.draft : this.context.locale}
                  label={this.props.intl.formatMessage(messages['account.settings.field.site.language'])}
                  helpText={this.props.intl.formatMessage(messages['account.settings.field.site.language.help.text'])}
                  {...editableFieldProps}
                />
                <EditableSelectField
                  name="time_zone"
                  type="select"
                  value={this.props.formValues.time_zone}
                  options={timeZoneOptions}
                  label={this.props.intl.formatMessage(messages['account.settings.field.time.zone'])}
                  emptyLabel={this.props.intl.formatMessage(messages['account.settings.field.time.zone.empty'])}
                  helpText={this.props.intl.formatMessage(messages['account.settings.field.time.zone.description'])}
                  {...editableFieldProps}
                  onSubmit={(formId, value) => {
                    this.handleSubmit(formId, value || null);
                  }}
                />
              </div>

              {/* Reset Password */}
              <div className='mt-4'>
                <ResetPassword email={this.props.formValues.email} />
              </div>

               {/* Delete Account */}
              <div className='mt-6'>

                {getConfig().ENABLE_ACCOUNT_DELETION && (
                  <div className="account-section pt-3 mb-5" id="delete-account" ref={this.navLinkRefs['#delete-account']}>
                    <DeleteAccount
                      isVerifiedAccount={this.props.isActive}
                      hasLinkedTPA={hasLinkedTPA}
                      canDeleteAccount={this.canDeleteAccount()}
                    />
                  </div>
                )} 
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderError() {
    return (
      <div>
        {this.props.intl.formatMessage(messages['account.settings.loading.error'], {
          error: this.props.loadingError,
        })}
      </div>
    );
  }

  renderLoading() {
    return (
      <PageLoading srMessage={this.props.intl.formatMessage(messages['account.settings.loading.message'])} />
    );
  }

  render() {
    const { loading, loaded, loadingError } = this.props;

    return (
      <div className="w-full xl:w-auto xl:min-w-[calc(100%-256px)] xl:ml-[256px] ">
        {/* {this.renderDuplicateTpaProviderMessage()} */}
         
       <div>
         <div className="z-40 fixed top-0 xl:py-5 w-full xl:flex items-center xl:bg-main px-4 md:px-8 lg:px-20 xl:px-36">
           <div className="hidden xl:block">
            {this.props.formValues.name ? (
                  <h1 className="font-semibold text-xl text-dim-black">
                    {this.props.formValues.name.split(' ')[0]}'s Dashboard - Let's jump back in.
                  </h1>
                ) : (
                  <h1 className="font-semibold text-xl text-dim-black">
                    Dashboard - Loading...
                  </h1>
              )}
           </div>       
           <div className="w-full lg:w-auto flex items-center justify-between xl:hidden bg-white py-5">
             {/* Logo */}
             <a href="home.html" className="h-10">
               <img
                 src="../asset/ask-logo.png"
                 alt="Africa sea of knowledge logo"
                 className="h-full object-cover bg-center"
               />
             </a>
             {/* Mobile Menu toggle button */}
             <button onClick={() => setMenuOpen(!menuOpen)} className="inline xl:hidden">
               <img src="../asset/menu.svg" alt="" className="scale-95" />
             </button>
           </div>
         </div>
       </div>
        <div className='w-full'>
          <div className=" ">
              {loading ? this.renderLoading() : null}
              {loaded ? this.renderContent() : null}
              {loadingError ? this.renderError() : null}
          </div>
        </div>
      </div>
    );
  }
}

AccountSettingsPage.contextType = AppContext;

AccountSettingsPage.propTypes = {
  intl: intlShape.isRequired,
  loading: PropTypes.bool,
  loaded: PropTypes.bool,
  loadingError: PropTypes.string,
  formValues: PropTypes.shape({
    username: PropTypes.string,
    name: PropTypes.string,
    firstName: PropTypes.string,
    middleName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    year_of_birth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    country: PropTypes.string,
    time_zone: PropTypes.string,
    useVerifiedNameForCerts: PropTypes.bool,
  }).isRequired,
  committedValues: PropTypes.shape({
    name: PropTypes.string,
    country: PropTypes.string,
  }),
  drafts: PropTypes.shape({}),
  siteLanguage: PropTypes.shape({
    previousValue: PropTypes.string,
    draft: PropTypes.string,
  }),
  siteLanguageOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })),
  staticFields: PropTypes.arrayOf(PropTypes.string),
  timeZoneOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })),
  countryTimeZoneOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  })),
  countriesCodesList: PropTypes.arrayOf(PropTypes.string),
  fetchCourseList: PropTypes.func.isRequired,
  fetchSettings: PropTypes.func.isRequired,
  saveSettings: PropTypes.func.isRequired,
  saveMultipleSettings: PropTypes.func.isRequired,
  updateDraft: PropTypes.func.isRequired,
  fetchSiteLanguages: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  location: PropTypes.string.isRequired,
  saveState: PropTypes.oneOf(['default', 'pending', 'complete', 'error']),
};

AccountSettingsPage.defaultProps = {
  loading: false,
  loaded: false,
  loadingError: null,
  committedValues: {
    name: '',
    country: '',
  },
  drafts: {},
  siteLanguage: null,
  siteLanguageOptions: [],
  timeZoneOptions: [],
  countryTimeZoneOptions: [],
  staticFields: [],
  countriesCodesList: [],
  saveState: 'default',
};

export default withLocation(withNavigate(connect(accountSettingsPageSelector, {
  fetchCourseList,
  fetchSettings,
  saveSettings,
  saveMultipleSettings,
  updateDraft,
  fetchSiteLanguages,
  beginNameChange,
})(injectIntl(AccountSettingsPage))));