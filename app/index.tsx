import { Redirect } from 'expo-router';

/** Land on the Meals tab by default. */
export default function Index() {
  return <Redirect href="/meals" />;
}
