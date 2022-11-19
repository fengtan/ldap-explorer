import { workspace } from 'vscode';

/**
 * Manages storage of CA Certificates in VS Code settings.
 */
export class CACertificateManager {

  /**
   * Get all CA certs stored in VS Code settings.
   */
  public static getCACerts(): string[] {
    return workspace.getConfiguration('ldap-explorer').get('cacerts', []);
  }

  /**
   * Add a new cert to settings.
   */
  public static addCACert(cacert: string): Thenable<void> {
    // Get list of existing certs.
    let cacerts = this.getCACerts();

    // Add the new cert.
    cacerts.push(cacert);

    // Save new list of certs and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('cacerts', cacerts, true);
  }

  // @todo edit option ? Including editing the same item multiple times

  /**
   * Updates an existing cert.
   */
  public static editCACert(newCACert: string, existingCACert: string): Thenable<void> {
    // Get list of existing certs.
    const cacerts = this.getCACerts();

    // Get index of cert to update.
    const index = cacerts.indexOf(existingCACert);
    if (index < 0) {
      return Promise.reject(`CA Cert '${existingCACert}' does not exist in settings`);
    }

    // Replace existing cert with new one.
    cacerts[index] = newCACert;

    // Save new list of certs and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('cacerts', cacerts, true);
  }

  /**
   * Remove an existing cert from settings.
   */
  public static removeCACert(cacert: string): Thenable<void> {
    // Get list of existing certs.
    const cacerts = this.getCACerts();

    // Get index of cert to delete.
    const index = cacerts.indexOf(cacert);
    if (index < 0) {
      return Promise.reject(`CA Cert '${cacert}' does not exist in settings`);
    }

    // Remove cert from the list.
    cacerts.splice(index, 1);

    // Save new list of certs and return Thenable.
    return workspace.getConfiguration('ldap-explorer').update('cacerts', cacerts, true);
  }

}
