import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export class IamConstruct extends Construct {
  public readonly role: iam.Role;
  public readonly user: iam.User;
  public readonly accessKey: iam.AccessKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.user = new iam.User(this, "user", {});
    this.role = new iam.Role(this, "role", { assumedBy: this.user });
    this.role.grantAssumeRole(this.user);
    this.accessKey = new iam.AccessKey(this, "access-key", {
      user: this.user,
    });
  }
}
