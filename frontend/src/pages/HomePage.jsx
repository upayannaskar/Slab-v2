import { UserButton } from "@clerk/clerk-react";

const HomePage = () => {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome! You are signed in.</p>
      <UserButton />
    </div>
  );
};

export default HomePage;
