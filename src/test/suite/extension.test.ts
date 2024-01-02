// general imports
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as Mocha from 'mocha';
// specific imports
import { VHDLbyHGB } from '../../vhdl_by_hgb';
import * as test_utils from './test_utils';

suite('Extension Test Suite', () => {

  Mocha.after(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  Mocha.test('valid extension', async () => {
    const extension = await test_utils.getExtension();
    assert.notStrictEqual(extension, undefined);

    if (!extension)
    {
      return;
    }

    const context = extension.getContext();
    assert.notStrictEqual(context, undefined);
  });

});