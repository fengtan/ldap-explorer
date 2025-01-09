import * as assert from 'assert';
import { LdapConnection } from '../../LdapConnection';
import * as utils from '../../webviews/utils';

suite('Extension test suite', () => {

  test('Test connection string', () => {
    // Create dummy connection.
    const connection: LdapConnection = new LdapConnection(
      "my connection",
      "ldap",
      "false",
      "true",
      "",
      "myserver.com",
      "1389",
      "cn=admin,dc=example,dc=org",
      "foobar",
      "dc=example,dc=org",
      "0",
      "true",
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
      "${starttls}",
      "${verifycert}",
      "${sni}",
      "${host}",
      "${port}",
      "${binddn}",
      "${bindpwd}",
      "${basedn}",
      "${sizelimit}",
      "${paged}",
      "${timeout}",
      []
    );
    // Set environment variables.
    process.env = {
      protocol: "ldap",
      starttls: "false",
      verifycert: "true",
      sni: "myserver.com",
      host: "myserver.com",
      port: "1389",
      binddn: "cn=admin,dc=example,dc=org",
      bindpwd: "foobar",
      basedn: "dc=example,dc=org",
      sizelimit: "0",
      paged: "true",
      timeout: "5000"
    };
    // Assert values.
    assert.strictEqual("my connection with env vars", connection.getName());
    assert.strictEqual("ldap", connection.getProtocol(true));
    assert.strictEqual("false", connection.getStartTLS(true));
    assert.strictEqual("true", connection.getVerifyCert(true));
    assert.strictEqual("myserver.com", connection.getSni(true));
    assert.strictEqual("myserver.com", connection.getHost(true));
    assert.strictEqual("1389", connection.getPort(true));
    assert.strictEqual("cn=admin,dc=example,dc=org", connection.getBindDn(true));
    assert.strictEqual("foobar", connection.getBindPwd(true));
    assert.strictEqual("dc=example,dc=org", connection.getBaseDn(true));
    assert.strictEqual("0", connection.getLimit(true));
    assert.strictEqual("true", connection.getPaged(true));
    assert.strictEqual("5000", connection.getTimeout(true));
  });

  test('Test binarySIDToText', () => {
    assert.strictEqual("S-1-5-21-4169144328-3425172002-2123581430-1103", 
      utils.binarySIDToText(Buffer.from("AQUAAAAAAAUVAAAACBiA+CL6J8z2R5N+TwQAAA==", "base64")));

    assert.strictEqual("S-1-5-21-4169144328-3425172002-2123581430-1140", 
      utils.binarySIDToText(Buffer.from("AQUAAAAAAAUVAAAACBiA+CL6J8z2R5N+dAQAAA==", "base64")));

    assert.strictEqual("S-1-5-21-4169144328-3425172002-2123581430-1130", 
      utils.binarySIDToText(Buffer.from("AQUAAAAAAAUVAAAACBiA+CL6J8z2R5N+agQAAA==", "base64")));

    assert.strictEqual("S-1-5-21-4169144328-3425172002-2123581430-1129", 
      utils.binarySIDToText(Buffer.from("AQUAAAAAAAUVAAAACBiA+CL6J8z2R5N+aQQAAA==", "base64")));
  });

});
