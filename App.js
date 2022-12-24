/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import {Colors, Header} from 'react-native/Libraries/NewAppScreen';

import {Amplify, Auth, Hub, Storage, Analytics} from 'aws-amplify';

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const Section = ({children, title}) => {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  // auth
  useEffect(() => {
    listenToHub();
    Auth.currentAuthenticatedUser()
      .then(user => setStoredUser(user))
      .catch(err => console.log(err));
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [storedUser, setStoredUser] = useState(null);
  const [totpCode, setTotpCode] = useState();
  const [challengeAnswer, setChallengeAnswer] = useState();
  const [preferredMFA, setPreferredMFA] = useState();
  const [challengeName, setChallengeName] = useState();
  const [totpChallengeAnswer, setTotpChallengeAnswer] = useState();
  const [newPassword, setNewPassword] = useState();
  const [validationData, setValidationData] = useState();
  const [newForgottenPassword, setNewForgottenPassword] = useState();
  const [forgottenPasswordCode, setForgottenPasswordCode] = useState();
  const [verificationCode, setVerificationCode] = useState();
  const [userAttributes, setUserAttributes] = useState();
  const [favoriteFlavor, setFavoriteFlavor] = useState();
  const [newEmail, setNewEmail] = useState();
  const [attributeUpdateCode, setAttributeUpdateCode] = useState();
  const [customState, setCustomState] = useState();

  async function signUp() {
    console.log(username);
    console.log(typeof username);
    console.log(password);
    console.log(email);
    console.log(phone_number);
    try {
      const {user} = await Auth.signUp({
        username,
        password,
        attributes: {
          email, // optional
          phone_number, // optional - E.164 number convention
          // other custom attributes
          'custom:favorite_flavor': 'Cookie Dough', // custom attribute, not standard
        },
        autoSignIn: {
          // optional - enables auto sign in after user is confirmed
          enabled: true,
        },
      });
      console.log(user);
    } catch (error) {
      console.log('error signing up:', error);
    }
  }

  // Sign up, Sign in & Sign out
  function listenToHub() {
    Hub.listen('auth', ({payload}) => {
      const {event, data} = payload;
      console.log('event: ', event);
      switch (event) {
        case 'signUp':
          console.log('sign up');
          console.log(data);
          break;
        case 'autoSignIn':
        case 'signIn':
          // assign user
          console.log(data);
          setStoredUser(data);
          break;
        case 'autoSignIn_failure':
          // redirect to sign in page
          console.log('auto sign in failed');
          break;
        case 'signOut':
          setStoredUser(null);
          break;
        case 'customOAuthState':
          setCustomState(data);
          break;
        case 'parsingCallbackUrl':
          console.log(payload);
          break;
      }
    });
  }

  async function confirmSignUp() {
    try {
      await Auth.confirmSignUp(username, code);
    } catch (error) {
      console.log('error confirming sign up', error);
    }
  }

  async function resendConfirmationCode() {
    try {
      await Auth.resendSignUp(username);
      console.log('code resent successfully');
    } catch (err) {
      console.log('error resending code: ', err);
    }
  }

  async function signIn() {
    try {
      const user = await Auth.signIn(username, password);
      setChallengeName(user.challengeName);
      if (
        user.challengeName === 'SMS_MFA' ||
        user.challengeName === 'SOFTWARE_TOKEN_MFA'
      ) {
        const loggedUser = await Auth.confirmSignIn(
          user,
          totpChallengeAnswer,
          challengeName,
        );
        console.log(loggedUser);
        setStoredUser(loggedUser);
        recordPersonalizeIdentifyEvent(loggedUser);
      } else if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
        const {requiredAttributes} = user.challengeParam; // the array of required attributes, e.g ['email', 'phone_number']
        // You need to get the new password and required attributes from the UI inputs
        // and then trigger the following function with a button click
        // For example, the email and phone_number are required attributes
        const loggedUser = await Auth.completeNewPassword(
          user, // the Cognito User Object
          newPassword, // the new password
          // OPTIONAL, the required attributes
          {
            email,
            phone_number,
          },
        );
        setStoredUser(loggedUser);
      } else if (user.challengeName === 'MFA_SETUP') {
        // This happens when the MFA method is TOTP
        // The user needs to setup the TOTP before using it
        // More info please check the Enabling MFA part
        setupTOTP(user);
      } else {
        // The user directly signs in
        console.log(user);
        setStoredUser(user);
      }
    } catch (error) {
      console.log('error signing in', error);
    }
  }

  async function signOut() {
    try {
      await Auth.signOut();
      setStoredUser(null);
    } catch (error) {
      console.log('error signing out: ', error);
    }
  }

  async function globalSignOut() {
    try {
      await Auth.signOut({global: true});
      setStoredUser(null);
    } catch (error) {
      console.log('error signing out globally: ', error);
    }
  }

  // Multi-factor authentication
  async function setupTOTP(user = null) {
    user = await Auth.currentAuthenticatedUser();
    Auth.setupTOTP(user)
      .then(tempCode => {
        console.log(tempCode);
        setTotpCode(tempCode);
      })
      .catch(e => {
        console.log('error setting up TOTP: ', e);
      });
  }

  async function verifyTOTP() {
    console.log('challengename', storedUser);
    Auth.verifyTotpToken(storedUser, challengeAnswer)
      .then(() => {
        // don't forget to set TOTP as the preferred MFA method
        Auth.setPreferredMFA(storedUser, 'TOTP');
        console.log('verified TOTP');
      })
      .catch(e => {
        // Token is not verified
        console.log('error verifying TOTP: ', e);
      });
  }

  async function setPreferredTOTP() {
    console.log('setting preferred TOTP');
    Auth.setPreferredMFA(storedUser, 'TOTP')
      .then(data => {
        console.log(data);
      })
      .catch(e => {
        console.log('error setting preferred TOTP: ', e);
      });
  }

  async function setPreferredSMS() {
    console.log('setting preferred SMS');
    Auth.setPreferredMFA(storedUser, 'SMS')
      .then(data => {
        console.log(data);
      })
      .catch(e => {
        console.log('error setting preferred SMS: ', e);
      });
  }

  async function setPreferredNoMFA() {
    console.log('setting preferred No MFA');
    Auth.setPreferredMFA(storedUser, 'NOMFA')
      .then(data => {
        console.log(data);
      })
      .catch(e => {
        console.log('error setting preferred No MFA: ', e);
      });
  }

  async function getPreferred() {
    // Will retrieve the current mfa type from cache
    Auth.getPreferredMFA(storedUser, {
      // Optional, by default is false.
      // If set to true, it will get the MFA type from server side instead of from local cache.
      bypassCache: false,
    })
      .then(data => {
        console.log('Current preferred MFA type is: ' + data);
        setPreferredMFA(data);
      })
      .catch(e => {
        console.log('error getting preferred MFA: ', e);
      });
  }

  async function customValidationData() {
    try {
      const user = await Auth.signIn({
        username, // Required, the username
        password, // Optional, the password
        validationData, // Optional, an arbitrary key-value pair map which can contain any key and will be passed to your PreAuthentication Lambda trigger as-is. It can be used to implement additional validations around authentication
      });
      console.log('user is signed in!', user);
    } catch (error) {
      console.log('error signing in:', error);
    }
  }

  // Password & User Management
  async function changePassword() {
    Auth.currentAuthenticatedUser()
      .then(user => {
        return Auth.changePassword(user, password, newPassword);
      })
      .then(data => console.log(data))
      .catch(err => console.log(err));
  }

  async function forgotPassword() {
    Auth.forgotPassword(username)
      .then(data => console.log(data))
      .catch(err => console.log(err));
  }

  async function forgotPasswordSubmit() {
    Auth.forgotPasswordSubmit(
      username,
      forgottenPasswordCode,
      newForgottenPassword,
    )
      .then(data => console.log(data))
      .catch(err => console.log(err));
  }

  async function verifyCurrentUser(attr) {
    Auth.verifyCurrentUserAttribute(attr)
      .then(() => {
        console.log('attribute verification code has been sent');
      })
      .catch(e => {
        console.log('failed with error: ', e);
      });
  }

  async function verifyCurrentUserSubmit(attr) {
    Auth.verifyCurrentUserAttributeSubmit(attr, verificationCode)
      .then(() => {
        console.log(`${attr} verified`);
      })
      .catch(e => {
        console.log('failed with error: ', e);
      });
  }

  async function retrieveCurrentUser() {
    Auth.currentAuthenticatedUser({bypassCache: true})
      .then(async user => {
        console.log(user);
        setStoredUser(user);
        setUserAttributes(user.attributes);
      })
      .catch(err => console.log(err));
  }

  async function refreshSession() {
    Auth.currentSession()
      .then(data => console.log(data))
      .catch(err => console.log(err));
  }

  async function updateUserAttributes() {
    let result = await Auth.updateUserAttributes(storedUser, {
      email: newEmail || storedUser.attributes.email,
      'custom:favorite_flavor': favoriteFlavor || 'chocolate',
      phone_number: '+11234567890',
    });
    console.log(result);
    retrieveCurrentUser();
  }

  async function deleteUserAttributes() {
    let result = await Auth.deleteUserAttributes(storedUser, [
      'custom:favorite_flavor',
    ]);
    console.log(result);
    retrieveCurrentUser();
  }

  async function confirmAttributeCode() {
    let result = await Auth.verifyCurrentUserAttributeSubmit(
      'email',
      attributeUpdateCode,
    );
    console.log(result);
  }

  async function deleteUser() {
    try {
      const result = await Auth.deleteUser();
      console.log(result);
    } catch (error) {
      console.log('Error deleting user', error);
    }
  }

  // Device Memory
  async function rememberDevice() {
    try {
      const result = await Auth.rememberDevice();
      console.log('Remembered device ', result);
    } catch (error) {
      console.log('Error remembering device', error);
    }
  }

  async function forgetDevice() {
    try {
      const result = await Auth.forgetDevice();
      console.log('Forgot device ', result);
    } catch (error) {
      console.log('Error forgetting device', error);
    }
  }

  async function fetchDevices() {
    try {
      const result = await Auth.fetchDevices();
      console.log('Devices: ', result);
    } catch (err) {
      console.log('Error fetching devices', err);
    }
  }

  // smoke test
  async function smokeTest() {
    var c1 = await Auth.currentCredentials();
    var c2 = await Auth.currentUserCredentials();
    console.log('c1', c1);
    console.log('c2', c2);

    Storage.list('')
      .then(result => console.log(result))
      .catch(err => console.log(err));
  }

  // analytics
  const analyticsData = {
    username: storedUser ? storedUser.username : 'no user',
    email: storedUser ? storedUser.attributes.email : 'no email',
    action: 'userRetrieved',
  };

  // pinpoint
  async function recordPinpointEvent() {
    await Analytics.record({
      name: 'pinpointUser',
      // attributes must be strings
      attributes: analyticsData,
      // metrics must be numbers (int or float)
      metrics: {app: 1},
    });
  }

  // kinesis
  async function recordKinesisEvent() {
    await Analytics.record(
      {
        data: analyticsData,
        // OPTIONAL
        partitionKey: 'myPartitionKey',
        streamName: 'rncliv5newKinesis-dev',
      },
      'AWSKinesis',
    );
  }

  // kinesis firehose
  // not working correctly
  async function recordFirehoseEvent() {
    await Analytics.record(
      {
        data: analyticsData,
        streamName: 'KDS-S3-SeN4i', // required
      },
      'AWSKinesisFirehose',
    );
  }

  // personalization identify
  async function recordPersonalizeIdentifyEvent(user) {
    await Analytics.record(
      {
        eventType: 'Identify',
        properties: {
          userId: user.username,
        },
      },
      'AmazonPersonalize',
    );
  }

  // personalization event
  async function recordPersonalizeEvent() {
    console.log({storedUser});
    await Analytics.record(
      {
        eventType: 'ButtonPress',
        // userId: storedUser.username, // optional, needed if not capturing in Identify
        properties: {
          itemId: 'standalonePersonalizeButton',
          eventValue: 'pressedButton',
        },
      },
      'AmazonPersonalize',
    );
  }

  // personalization media
  async function recordPersonalizeMediaEvent() {
    await Analytics.record(
      {
        eventType: 'MediaAutoTrack',
        // userId: storedUser.username, // optional, needed if not capturing in Identify
        properties: {
          domElementId: 'MEDIA DOM ELEMENT ID',
          itemId: 'MEDIA ITEM ID',
        },
      },
      'AmazonPersonalize',
    );
  }

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        {/* <Header /> */}
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Sign Up">
            <TextInput
              style={styles.input}
              onChangeText={setUsername}
              value={username}
              placeholder="Username"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              placeholder="Password"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder="Email"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              onChangeText={setPhoneNumber}
              value={phone_number}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
            <Button onPress={signUp} title="Sign Up" />
          </Section>
          <Section title="Confirm Sign Up">
            <TextInput
              style={styles.input}
              onChangeText={setCode}
              value={code}
              placeholder="Confirmation Code"
            />
            <Button onPress={confirmSignUp} title="Confirm Sign Up" />
            <Button
              onPress={resendConfirmationCode}
              title="Resend Confirmation"
            />
          </Section>
          <Section title="Sign In/Out">
            <Text style={styles.sectionDescription}>
              {storedUser ? `Signed In: ${storedUser.username}` : 'Signed Out'}
            </Text>
            <Button onPress={signIn} title="Sign In" />
            <Button onPress={signOut} title="Sign Out" />
            <Button onPress={globalSignOut} title="Global Sign Out" />
          </Section>
          <Section title="Social Sign In">
            <Button
              onPress={() => Auth.federatedSignIn()}
              title="Open Hosted UI"
            />
            <Button
              onPress={() => Auth.federatedSignIn({provider: 'Google'})}
              title="Open Google"
            />
            <Button
              onPress={() => Auth.federatedSignIn({provider: 'Facebook'})}
              title="Open Facebook"
            />
            <Button onPress={smokeTest} title="Smoke Test" />
          </Section>
          <Section title="MFA">
            <Text>{totpCode}</Text>
            <Button onPress={setupTOTP} title="Request TOTP Code" />
            <TextInput
              style={styles.input}
              onChangeText={setChallengeAnswer}
              value={challengeAnswer}
              placeholder="TOTP Challenge Answer"
            />
            <Button onPress={verifyTOTP} title="Verify TOTP" />
            <Button onPress={setPreferredTOTP} title="Set Preferred to TOTP" />
            <Button onPress={setPreferredSMS} title="Set Preferred to SMS" />
            <Button
              onPress={setPreferredNoMFA}
              title="Set Preferred to No MFA"
            />
            <Text>Preferred MFA: {preferredMFA || ''}</Text>
            <Button onPress={getPreferred} title="Get Preferred MFA" />
            <Text>Challenge Name: {challengeName}</Text>
            <TextInput
              style={styles.input}
              onChangeText={setTotpChallengeAnswer}
              value={totpChallengeAnswer}
              placeholder="TOTP Challenge Answer"
            />
            <TextInput
              style={styles.input}
              onChangeText={setNewPassword}
              value={newPassword}
              placeholder="New Password"
            />
            <Button onPress={signIn} title="Sign In with Challenge Answers" />
            <TextInput
              style={styles.input}
              onChangeText={setValidationData}
              value={validationData}
              placeholder="Validation Data"
            />
            <Button
              onPress={customValidationData}
              title="Sign In with Custom Validation Data"
            />
          </Section>
          <Section title={'Password & User Management'}>
            <TextInput
              style={styles.input}
              onChangeText={setNewPassword}
              value={newPassword}
              placeholder="New Password"
            />
            <Button onPress={changePassword} title="Change Password" />
            <Text>Forgot Password</Text>
            <Button
              onPress={forgotPassword}
              title="Send Forgot Password Email"
            />
            <TextInput
              style={styles.input}
              onChangeText={setForgottenPasswordCode}
              value={forgottenPasswordCode}
              placeholder="Password Code"
            />
            <TextInput
              style={styles.input}
              onChangeText={setNewForgottenPassword}
              value={newForgottenPassword}
              placeholder="Forgotten Password Code"
            />
            <Button
              onPress={forgotPasswordSubmit}
              title="Reset with New Password"
            />
            <Text>Verify User</Text>
            <Button
              onPress={() => verifyCurrentUser('phone_number')}
              title="Send Phone Verification"
            />
            <Button
              onPress={() => verifyCurrentUser('email')}
              title="Send Email Verification"
            />
            <TextInput
              style={styles.input}
              onChangeText={setVerificationCode}
              value={verificationCode}
              placeholder="Verification Code"
            />
            <Button
              onPress={() => verifyCurrentUserSubmit('phone_number')}
              title="Verify User Phone"
            />
            <Button
              onPress={() => verifyCurrentUserSubmit('email')}
              title="Verify User Email"
            />
            <Button onPress={retrieveCurrentUser} title="Retrieve User" />
            <Text>User: {storedUser && storedUser.username}</Text>
            <Text>Attributes: {JSON.stringify(userAttributes, null, 2)}</Text>
            <Button onPress={refreshSession} title="Refresh Session" />
            <TextInput
              style={styles.input}
              onChangeText={setFavoriteFlavor}
              value={favoriteFlavor}
              placeholder="Favorite Flavor"
            />
            <Button
              onPress={updateUserAttributes}
              title="Update User Attributes"
            />
            <Button
              onPress={deleteUserAttributes}
              title="Delete User Attributes"
            />
            <Text>Change Email for User</Text>
            <TextInput
              style={styles.input}
              onChangeText={setNewEmail}
              value={newEmail}
              placeholder="New Email"
            />
            <Button onPress={updateUserAttributes} title="Update Email" />
            <TextInput
              style={styles.input}
              onChangeText={setAttributeUpdateCode}
              value={attributeUpdateCode}
              placeholder="Attribute Update Code"
            />
            <Button onPress={confirmAttributeCode} title="Confirm Code" />
            <Button onPress={deleteUser} title="Delete Current User" />
          </Section>
          <Section title="Device Memory">
            <Button onPress={rememberDevice} title="Remember Device" />
            <Button onPress={forgetDevice} title="Forget Device" />
            <Button onPress={fetchDevices} title="Fetch Devices" />
          </Section>
          <Section title="Analytics">
            <Button
              onPress={recordPinpointEvent}
              title="Record Pinpoint Event"
            />
            <Button onPress={recordKinesisEvent} title="Record Kinesis Event" />
            <Button
              onPress={recordFirehoseEvent}
              title="Record Firehose Event"
            />
            <Button
              onPress={recordPersonalizeEvent}
              title="Record Personalize Event"
            />
            <Button
              onPress={recordPersonalizeMediaEvent}
              title="Record Media Event"
            />
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export default App;
