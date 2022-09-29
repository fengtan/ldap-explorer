/*
 * A fake LDAP entry i.e. one that is not the result of a LDAP query.
 */
export class FakeEntry {

  public dn: string;

  constructor(dn: string) {
    this.dn = dn;
  }

}
