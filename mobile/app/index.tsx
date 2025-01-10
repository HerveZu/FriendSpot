import { Text, View } from "react-native";
import Signup from "./components/signup";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Signup />
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
