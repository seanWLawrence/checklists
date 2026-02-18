import { redirect } from "next/navigation";

const LegacyUserCredentialGeneratorPage: React.FC = () => {
  redirect("/admin/user-credential-generator");
};

export default LegacyUserCredentialGeneratorPage;
