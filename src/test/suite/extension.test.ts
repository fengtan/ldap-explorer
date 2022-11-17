import * as assert from 'assert';
import { LdapConnection } from '../../LdapConnection';

suite('Extension test suite', () => {

  test('Test connection string', () => {
    // Create dummy connection.
    const connection: LdapConnection = new LdapConnection(
      "my connection",
      "ldap",
      "true",
      "",
      "myserver.com",
      "1389",
      "cn=admin,dc=example,dc=org",
      "foobar",
      "dc=example,dc=org",
      "0",
      "5000",
      []
    );
    // Assert connection string.
    assert.strictEqual("ldap://myserver.com:1389", connection.getUrl());
  });

  test('Test environment variables', () => {
    // Create connection which parameters are defined with environment variables.
    const connection: LdapConnection = new LdapConnection(
      "my connection with env vars",
      "${protocol}",
      "${verifycert}",
      "${sni}",
      "${host}",
      "${port}",
      "${binddn}",
      "${bindpwd}",
      "${basedn}",
      "${sizelimit}",
      "${timeout}",
      []
    );
    // Set environment variables.
    process.env = {
      protocol: "ldap",
      verifycert: "true",
      sni: "myserver.com",
      host: "myserver.com",
      port: "1389",
      binddn: "cn=admin,dc=example,dc=org",
      bindpwd: "foobar",
      basedn: "dc=example,dc=org",
      sizelimit: "0",
      timeout: "5000"
    };
    // Assert values.
    assert.strictEqual("my connection with env vars", connection.getName());
    assert.strictEqual("ldap", connection.getProtocol(true));
    assert.strictEqual("true", connection.getVerifyCert(true));
    assert.strictEqual("myserver.com", connection.getSni(true));
    assert.strictEqual("myserver.com", connection.getHost(true));
    assert.strictEqual("1389", connection.getPort(true));
    assert.strictEqual("cn=admin,dc=example,dc=org", connection.getBindDn(true));
    assert.strictEqual("foobar", connection.getBindPwd(true));
    assert.strictEqual("dc=example,dc=org", connection.getBaseDn(true));
    assert.strictEqual("0", connection.getLimit(true));
    assert.strictEqual("5000", connection.getTimeout(true));
  });

});
