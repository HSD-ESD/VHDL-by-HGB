
import Octokit = require('@octokit/rest');
import util = require('util');
import vscode = require('vscode');
import extract = require('extract-zip');
import * as fs from 'fs-extra';
import { workspace, ExtensionContext, window} from 'vscode';
import semver = require('semver');
import AbortController from 'abort-controller';
import fetch from 'node-fetch';
import * as path from 'path';
import * as lockfile from 'proper-lockfile';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
} from 'vscode-languageclient/node';


const exec = util.promisify(require('child_process').exec);
const output = vscode.window.createOutputChannel('VHDL-LS Client');
const traceOutputChannel = vscode.window.createOutputChannel('VHDL-LS Trace');

const isWindows = process.platform === 'win32';
const languageServerName = isWindows
    ? 'vhdl_ls-x86_64-pc-windows-msvc'
    : 'vhdl_ls-x86_64-unknown-linux-musl';
const languageServerBinaryName = 'vhdl_ls';
let languageServer: string;

//let client: LanguageClient;

enum LanguageServerBinary {
    embedded,
    user,
    systemPath,
}


export class RustHDL {

    //--------------------------------------------
    //Private Members
    //--------------------------------------------
    private client!: LanguageClient;
    private context: ExtensionContext;

    //--------------------------------------------
    //Public Methods
    //--------------------------------------------
    constructor(context: ExtensionContext) {
        this.context = context;
        this.RegisterCommands();
    }

    public async Activate() {

        const languageServerDir = this.context.asAbsolutePath(
            path.join('server', 'vhdl_ls')
        );
        output.appendLine(
            'Checking for language server executable in ' + languageServerDir
        );
        let languageServerVersion = embeddedVersion(languageServerDir);
        if (languageServerVersion === '0.0.0') {
            output.appendLine('No language server installed');
            window.showInformationMessage('Downloading language server...');
            await getLatestLanguageServer(60000, this.context);
            languageServerVersion = embeddedVersion(languageServerDir);
        } else {
            output.appendLine('Found version ' + languageServerVersion);
        }
        languageServer = path.join(
            'server',
            'vhdl_ls',
            languageServerVersion,
            languageServerName,
            'bin',
            languageServerBinaryName + (isWindows ? '.exe' : '')
        );
    
        // Get language server configuration and command to start server
    
        let workspace = vscode.workspace;
        let languageServerBinary = workspace
            .getConfiguration()
            .get('vhdlls.languageServer');
        let lsBinary = languageServerBinary as keyof typeof LanguageServerBinary;
        let serverOptions: ServerOptions;
        switch (lsBinary) {
            case 'embedded':
                serverOptions = getServerOptionsEmbedded(this.context);
                output.appendLine('Using embedded language server');
                break;
    
            case 'user':
                serverOptions = getServerOptionsUser(this.context);
                output.appendLine('Using user specified language server');
                break;
    
            case 'systemPath':
                serverOptions = getServerOptionsSystemPath();
                output.appendLine('Running language server from path');
                break;
    
            default:
                serverOptions = getServerOptionsEmbedded(this.context);
                output.appendLine('Using embedded language server (default)');
                break;
        }
    
        // Options to control the language client
        let clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'vhdl' }],
            initializationOptions: vscode.workspace.getConfiguration('vhdlls'),
            traceOutputChannel,
        };
        if (workspace.workspaceFolders) {
            clientOptions.synchronize = {
                fileEvents: workspace.createFileSystemWatcher(
                    path.join(
                        workspace.workspaceFolders[0].uri.fsPath,
                        'vhdl_ls.toml'
                    )
                ),
            };
        }
    
        // Create the language client
        this.client = new LanguageClient(
            'vhdlls',
            'VHDL LS',
            serverOptions,
            clientOptions
        );
    
        // Start the client. This will also launch the server
        let languageServerDisposable = this.client.start();
    
        // Register command to restart language server
        this.context.subscriptions.push(languageServerDisposable);
        this.context.subscriptions.push(
            vscode.commands.registerCommand('VHDLbyHGB.vhdlls.restart', async () => {
                const MSG = 'Restarting VHDL LS';
                output.appendLine(MSG);
                window.showInformationMessage(MSG);
                await this.client.stop();
                languageServerDisposable.dispose();
                languageServerDisposable = this.client.start();
                this.context.subscriptions.push(languageServerDisposable);
            })
        );
    
        output.appendLine('Checking for updates...');
        lockfile
            .lock(this.context.asAbsolutePath('server'), {
                lockfilePath: this.context.asAbsolutePath(path.join('server', '.lock')),
            })
            .then((release: () => void) => {
                getLatestLanguageServer(60000, this.context)
                    .catch((err) => {
                        output.appendLine(err);
                    })
                    .finally(() => {
                        output.appendLine('Language server update finished.');
                        return release();
                    });
            });
    
        output.appendLine('Language server started');
    
    }

    public Deactivate() : Thenable<void> | undefined
    {
        if (!this.client) {
            return undefined;
        }
        return this.client.stop();
    }

    //--------------------------------------------
    //Private Methods
    //--------------------------------------------
    private RegisterCommands() : void
    {
        vscode.commands.registerCommand('VHDLbyHGB.vhdlls.activate', () => this.Activate());
        vscode.commands.registerCommand('VHDLbyHGB.vhdlls.deactivate', () => this.Deactivate());
    }

}

//--------------------------------------------
// module-internal Functions
//--------------------------------------------
function embeddedVersion(languageServerDir: string): string {
    try {
        return fs
            .readdirSync(languageServerDir)
            .reduce((version: string, dir: string) => {
                if (semver.gt(dir, version)) {
                    fs.remove(path.join(languageServerDir, version)).catch(
                        (err: any) => {
                            output.appendLine(err);
                        }
                    );
                    return dir;
                } else {
                    return version;
                }
            }, '0.0.0');
    } catch {
        return '0.0.0';
    }
}

async function getServerOptionsDocker() : Promise<ServerOptions | undefined> {
    const image = 'kraigher/vhdl_ls:latest';
    let pullCmd = 'docker pull ' + image;
    output.appendLine(`Pulling '${image}'`);
    output.appendLine(pullCmd);
    const { stdout, stderr } = await exec(pullCmd);
    output.append(stdout);
    output.append(stderr);

    let wsPath : string;
    if(vscode.workspace.workspaceFolders) {
        wsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    else {
        return undefined;
    }
    let mountPath = wsPath;
    if (isWindows) {
        wsPath = wsPath.replace(/\\/g, '/');
        mountPath = '/' + wsPath.replace(':', '');
    }

    let serverCommand = 'docker';
    let serverArgs = [
        'run',
        '-i',
        '-a',
        'stdin',
        '-a',
        'stdout',
        '-a',
        'stderr',
        '--rm',
        '-w',
        mountPath,
        '-v',
        `${wsPath}:${mountPath}:ro`,
        image,
    ];
    let serverOptions: ServerOptions = {
        run: {
            command: serverCommand,
            args: serverArgs,
        },
        debug: {
            command: serverCommand,
            args: serverArgs,
        },
    };
    return serverOptions;
}

function getServerOptionsEmbedded(context: ExtensionContext) {
    let serverCommand = context.asAbsolutePath(languageServer);
    let serverOptions: ServerOptions = {
        run: {
            command: serverCommand,
        },
        debug: {
            command: serverCommand,
        },
    };
    return serverOptions;
}

function getServerOptionsUser(context: ExtensionContext) {

    let serverCommand: string = vscode.workspace
        .getConfiguration()
        .get('vhdlls.languageServerUserPath')!;
    
    let serverOptions: ServerOptions = {
        run: {
            command: serverCommand,
        },
        debug: {
            command: serverCommand,
        },
    };
    return serverOptions;
}

function getServerOptionsSystemPath() {
    let serverCommand = languageServerBinaryName;
    let serverOptions: ServerOptions = {
        run: {
            command: serverCommand,
        },
        debug: {
            command: serverCommand,
        },
    };
    return serverOptions;
}

const rustHdl = {
    owner: 'VHDL-LS',
    repo: 'rust_hdl',
};

async function getLatestLanguageServer(
    timeoutMs: number,
    ctx: ExtensionContext
) {
    // Get current and latest version
    const octokit = new Octokit({ userAgent: 'rust_hdl_vscode' });
    let latestRelease = await octokit.repos.getLatestRelease({
        owner: rustHdl.owner,
        repo: rustHdl.repo,
    });
    if (latestRelease.status !== 200) {
        throw new Error('Status 200 return when getting latest release');
    }
    let current: string;
    if (languageServer) {
        let { stdout, stderr } = await exec(
            `"${ctx.asAbsolutePath(languageServer)}" --version`
        );
        current = semver.valid(semver.coerce(stdout.split(' ', 2)[1]))!;
    } else {
        current = '0.0.0';
    }

    let latest = semver.valid(semver.coerce(latestRelease.data.name));
    output.appendLine(`Current vhdl_ls version: ${current}`);
    output.appendLine(`Latest vhdl_ls version: ${latest}`);

    // Download new version if available
    if (semver.prerelease(latest!)) {
        output.appendLine('Latest version is pre-release, skipping');
    } else if (semver.lte(latest!, current)) {
        output.appendLine('Language server is up-to-date');
    } else {
        const languageServerAssetName = languageServerName + '.zip';
        let browser_download_url = latestRelease.data.assets.filter(
            (asset) => asset.name === languageServerAssetName
        )[0].browser_download_url;
        if (browser_download_url.length === 0) {
            throw new Error(
                `No asset with name ${languageServerAssetName} in release.`
            );
        }

        output.appendLine('Fetching ' + browser_download_url);
        const abortController = new AbortController();
        const timeout = setTimeout(() => {
            abortController.abort();
        }, timeoutMs);
        let download = await fetch(browser_download_url, {
            signal: abortController.signal,
        }).catch((err) => {
            output.appendLine(err);
            throw new Error(
                `Language server download timed out after ${timeoutMs.toFixed(
                    2
                )} seconds.`
            );
        });
        if (download.status !== 200) {
            throw new Error('Download returned status != 200');
        }
        const languageServerAsset = ctx.asAbsolutePath(
            path.join('server', 'install', latest!, languageServerAssetName)
        );
        output.appendLine(`Writing ${languageServerAsset}`);
        if (!fs.existsSync(path.dirname(languageServerAsset))) {
            fs.mkdirSync(path.dirname(languageServerAsset), {
                recursive: true,
            });
        }

        await new Promise<void>((resolve, reject) => {
            const dest = fs.createWriteStream(languageServerAsset, {
                autoClose: true,
            });
            download.body.pipe(dest);
            dest.on('finish', () => {
                output.appendLine('Server download complete');
                resolve();
            });
            dest.on('error', (err: any) => {
                output.appendLine('Server download error');
                reject(err);
            });
        });

        await new Promise<void>((resolve, reject) => {
            const targetDir = ctx.asAbsolutePath(
                path.join('server', 'vhdl_ls', latest!)
            );
            output.appendLine(
                `Extracting ${languageServerAsset} to ${targetDir}`
            );
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            extract(languageServerAsset, { dir: targetDir }, (err) => {
                try {
                    fs.removeSync(
                        ctx.asAbsolutePath(path.join('server', 'install'))
                    );
                } catch {}
                if (err) {
                    output.appendLine('Error when extracting server');
                    output.appendLine(err);
                    try {
                        fs.removeSync(targetDir);
                    } catch {}
                    reject(err);
                } else {
                    output.appendLine('Server extracted');
                    resolve();
                }
            });
        });
    }
    return Promise.resolve();
}

