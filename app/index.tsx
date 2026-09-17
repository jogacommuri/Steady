import { Redirect } from 'expo-router';

/** Land on the Today tab by default. */
export default function Index() {
  return <Redirect href="/today" />;
}
