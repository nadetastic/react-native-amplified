/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useState, useEffect} from 'react';
import type {Node} from 'react';
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

import {Auth, Hub} from 'aws-amplify';

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
const Section = ({children, title}): Node => {
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

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  useEffect(() => {
    listenToAutoSignInEvent();
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [storedUser, setStoredUser] = useState(null);

  async function signUp() {
    console.log(username);
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

  function listenToAutoSignInEvent() {
    Hub.listen('auth', ({payload}) => {
      const {event} = payload;
      console.log('event: ', event);
      if (event === 'autoSignIn') {
        const user = payload.data;
        // assign user
        console.log(user);
        setStoredUser(user);
      } else if (event === 'autoSignIn_failure') {
        // redirect to sign in page
        console.log('auto sign in failed');
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
      setStoredUser(user);
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
              autoCapitalize="none"
            />
            <Button onPress={confirmSignUp} title="Confirm Sign Up" />
            <Button
              onPress={resendConfirmationCode}
              title="Resend Confirmation"
            />
          </Section>
          <Section title="Sign In/Out">
            <Text style={styles.sectionDescription}>
              {storedUser ? 'Signed In' : 'Signed Out'}
            </Text>
            <Button onPress={signIn} title="Sign In" />
            <Button onPress={signOut} title="Sign Out" />
            <Button onPress={globalSignOut} title="Global Sign Out" />
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
