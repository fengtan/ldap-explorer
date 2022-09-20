// A fake LDAP entry i.e. one that is not the result of a LDAP query.
// @todo ideally only use new SearchEntry() and don't resort to this band-aid class.
export class FakeEntry {

  public dn: string;

  constructor(dn: string) {
    this.dn = dn;
  }

}
