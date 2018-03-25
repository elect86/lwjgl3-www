// @flow
import * as React from 'react';
import { MODE_MAVEN, MODE_GRADLE, MODE_IVY, BUILD_RELEASE } from '../constants';
import type { BuildConfig, MODES, Mode, Addon, BUILD_TYPES, BindingDefinition, Platforms, NATIVES } from '../types';
import { Connect } from '~/store/Connect';
import { Breakpoint } from '~/components/Breakpoint';

import { BuildToolbar } from './BuildToolbar';
import IconDownload from 'react-icons/md/file-download';
import IconCopy from 'react-icons/md/content-copy';

const ALLOW_DOWNLOAD = window.btoa !== undefined;

type ConnectedProps = {|
  build: null | BUILD_TYPES,
  mode: Mode,
  version: string,
  hardcoded: boolean,
  compact: boolean,
  osgi: boolean,
  platform: Platforms,
  platformSingle: NATIVES | null,
  artifacts: { [string]: BindingDefinition },
  selected: Array<string>,
  addons: Array<Addon>,
|};

type Props = {|
  configDownload: Function,
|};

function getSelectedPlatforms(build: BuildConfig): NATIVES | null {
  let i = 0;
  let result = null;

  for (let i = 0; i < build.natives.allIds.length; i += 1) {
    const p = build.natives.allIds[i];
    if (build.platform[p]) {
      if (result === null) {
        result = p;
      } else {
        return null; // more than one platforms selected
      }
    }
  }

  return result;
}

export class BuildScript extends React.Component<Props> {
  //$FlowFixMe
  preRef = React.createRef();

  copyToClipboard = this.copyToClipboard.bind(this);
  copyToClipboard() {
    if (window.getSelection === undefined) {
      alert('Copying to clipboard not supported!');
      return;
    }
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
    const range = document.createRange();
    const pre = this.preRef.current;
    if (pre !== null) {
      range.selectNode(pre);
    } else {
      alert('Failed to copy text');
      return;
    }
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    alert('Script copied to clipboard.');
  }

  render() {
    return (
      <Breakpoint>
        {({ current, breakpoints: { sm, md } }) => (
          <Connect
            state={({ build }: { build: BuildConfig }): ConnectedProps => {
              // Artifacts
              const selected: Array<string> = [];

              build.artifacts.allIds.forEach(artifact => {
                if (build.contents[artifact] && build.availability[artifact]) {
                  selected.push(artifact);
                }
              });

              // Addons
              const addons: Array<Addon> = [];
              build.selectedAddons.forEach((id: string) => {
                const addon = build.addons.byId[id];
                if (addon.modes !== undefined && addon.modes.indexOf(build.mode) === -1) {
                  return;
                }
                addons.push(build.addons.byId[id]);
              });

              return {
                build: build.build,
                mode: build.modes.byId[build.mode],
                version: build.artifacts.version,
                hardcoded: build.hardcoded,
                compact: build.compact,
                osgi: build.osgi && parseInt(build.version.replace(/\./g, ''), 10) >= 312,
                platform: build.platform,
                platformSingle: getSelectedPlatforms(build),
                artifacts: build.artifacts.byId,
                selected,
                addons,
              };
            }}
          >
            {(props: ConnectedProps) => {
              const { mode } = props;

              const labels = {
                download: `DOWNLOAD ${typeof mode.file === 'string' ? mode.file.toUpperCase() : 'FILE'}`,
                copy: ' COPY TO CLIPBOARD',
              };

              if (current < sm) {
                labels.download = 'DOWNLOAD';
                labels.copy = '';
              } else if (current < md) {
                labels.copy = ' COPY';
              }

              const script = generateScript(mode.id, props);

              return (
                <div>
                  <h2 className="mt-1">
                    <img src={mode.logo} alt={mode.title} style={{ height: 60 }} />
                  </h2>
                  <pre ref={this.preRef} className="m-0">
                    <code>{script}</code>
                  </pre>
                  <BuildToolbar configDownload={this.props.configDownload}>
                    <a
                      className="btn btn-success"
                      download={mode.file}
                      href={`data:${mime(mode)};base64,${btoa(script)}`}
                      disabled={ALLOW_DOWNLOAD}
                      title={`Download ${mode.id} code snippet`}
                    >
                      <IconDownload /> {labels.download}
                    </a>
                    <button
                      className="btn btn-success"
                      onClick={this.copyToClipboard}
                      disabled={!document.execCommand}
                      title="Copy to clipboard"
                    >
                      <IconCopy />
                      {labels.copy}
                    </button>
                  </BuildToolbar>
                </div>
              );
            }}
          </Connect>
        )}
      </Breakpoint>
    );
  }
}

const mime = (mode: Mode) => (mode.file !== undefined && mode.file.endsWith('.xml') ? 'text/xml' : 'text/plain');
const getVersion = (version, build) => (build === BUILD_RELEASE ? version : `${version}-SNAPSHOT`);

function generateScript(mode: MODES, props: ConnectedProps): string {
  switch (mode) {
    case MODE_MAVEN:
      return generateMaven(props);
    case MODE_GRADLE:
      return generateGradle(props);
    case MODE_IVY:
      return generateIvy(props);
    default:
      throw 'Unsupported script mode';
  }
}

function generateDependencies(
  selected: Array<string>,
  artifacts: { [string]: BindingDefinition },
  platform: Platforms,
  generateJava: (string, boolean) => string,
  generateNative: string => string
): string {
  let script = '';
  let nativesBundle = '';

  selected.forEach(artifact => {
    let natives = artifacts[artifact].natives;
    let hasEnabledNativePlatform = natives !== undefined && natives.some(it => platform[it]);
    if (natives !== undefined && !hasEnabledNativePlatform && artifacts[artifact].nativesOptional !== true) {
      return;
    }
    script += generateJava(artifact, hasEnabledNativePlatform);
    if (hasEnabledNativePlatform) {
      nativesBundle += generateNative(artifact);
    }
  });

  return script + nativesBundle;
}

function generateMaven(props: ConnectedProps) {
  const { build, hardcoded, compact, osgi, platform, platformSingle, artifacts, selected, addons } = props;
  const version = getVersion(props.version, build);
  const v = hardcoded ? version : '${lwjgl.version}';
  const nl1 = compact ? '' : '\n\t';
  const nl2 = compact ? '' : '\n\t\t';
  const nl3 = compact ? '' : '\n\t\t\t';
  const groupId = osgi ? 'org.lwjgl.osgi' : 'org.lwjgl';
  const classifier = !hardcoded || platformSingle == null ? '${lwjgl.natives}' : `natives-${platformSingle}`;

  let script = '';
  if (!hardcoded) {
    script += `<properties>
\t<lwjgl.version>${version}</lwjgl.version>`;

    addons.forEach((addon: Addon) => {
      script += `\n\t<${addon.id}.version>${addon.maven.version}</${addon.id}.version>`;
    });

    if (platformSingle !== null) {
      script += `\n\t<lwjgl.natives>natives-${platformSingle}</lwjgl.natives>`;
    }

    script += `\n</properties>\n\n`;
  }
  if (platformSingle === null) {
    script += `<profiles>
\t<profile>${nl2}<id>lwjgl-natives-linux</id>${nl2}<activation>${nl3}<os><family>unix</family></os>${nl2}</activation>${nl2}<properties>${nl3}<lwjgl.natives>natives-linux</lwjgl.natives>${nl2}</properties>${nl1}</profile>
\t<profile>${nl2}<id>lwjgl-natives-macos</id>${nl2}<activation>${nl3}<os><family>mac</family></os>${nl2}</activation>${nl2}<properties>${nl3}<lwjgl.natives>natives-macos</lwjgl.natives>${nl2}</properties>${nl1}</profile>
\t<profile>${nl2}<id>lwjgl-natives-windows</id>${nl2}<activation>${nl3}<os><family>windows</family></os>${nl2}</activation>${nl2}<properties>${nl3}<lwjgl.natives>natives-windows</lwjgl.natives>${nl2}</properties>${nl1}</profile>
</profiles>\n\n`;
  }

  if (build !== BUILD_RELEASE) {
    script += `<repositories>
\t<repository>
\t\t<id>sonatype-snapshots</id>
\t\t<url>https://oss.sonatype.org/content/repositories/snapshots</url>
\t\t<releases><enabled>false</enabled></releases>
\t\t<snapshots><enabled>true</enabled></snapshots>
\t</repository>
</repositories>\n\n`;
  }

  script += `<dependencies>`;

  script += generateDependencies(
    selected,
    artifacts,
    platform,
    artifact =>
      `\n\t<dependency>${nl2}<groupId>${groupId}</groupId>${nl2}<artifactId>${artifact}</artifactId>${nl2}<version>${v}</version>${nl1}</dependency>`,
    artifact =>
      `\n\t<dependency>${nl2}<groupId>${groupId}</groupId>${nl2}<artifactId>${artifact}</artifactId>${nl2}<version>${v}</version>${nl2}<classifier>${classifier}</classifier>${nl1}</dependency>`
  );

  addons.forEach((addon: Addon) => {
    const maven = addon.maven;
    script += `\n\t<dependency>${nl2}<groupId>${maven.groupId}</groupId>${nl2}<artifactId>${
      maven.artifactId
    }</artifactId>${nl2}<version>${hardcoded ? maven.version : `\${${addon.id}.version}`}</version>${nl1}</dependency>`;
  });

  script += `\n</dependencies>`;

  return script;
}

function generateGradle(props: ConnectedProps) {
  const { build, hardcoded, osgi, artifacts, platform, platformSingle, selected, addons } = props;
  const version = getVersion(props.version, build);
  const v = hardcoded ? version : '$lwjglVersion';
  const groupId = osgi ? 'org.lwjgl.osgi' : 'org.lwjgl';
  const classifier = !hardcoded || platformSingle == null ? '$lwjglNatives' : `natives-${platformSingle}`;

  let script = platformSingle === null ? 'import org.gradle.internal.os.OperatingSystem\n\n' : '';

  if (!hardcoded) {
    script += `project.ext.lwjglVersion = "${version}"`;
    addons.forEach((addon: Addon) => {
      script += `\nproject.ext.${addon.id}Version = "${addon.maven.version}"`;
    });
    if (platformSingle !== null) {
      script += `\nproject.ext.lwjglNatives = "natives-${platformSingle}"`;
    }
    script += '\n\n';
  }
  if (platformSingle === null) {
    script += `switch ( OperatingSystem.current() ) {
\tcase OperatingSystem.WINDOWS:
\t\tproject.ext.lwjglNatives = "natives-windows"
\t\tbreak
\tcase OperatingSystem.LINUX:
\t\tproject.ext.lwjglNatives = "natives-linux"
\tbreak
\tcase OperatingSystem.MAC_OS:
\t\tproject.ext.lwjglNatives = "natives-macos"
\t\tbreak
}\n\n`;
  }

  script += `repositories {
\tmavenCentral()`;
  if (build !== BUILD_RELEASE) {
    script += `\n\tmaven { url "https://oss.sonatype.org/content/repositories/snapshots/" }`;
  }
  script += `
}

dependencies {`;

  script += generateDependencies(
    selected,
    artifacts,
    platform,
    artifact => `\n\tcompile "${groupId}:${artifact}:${v}"`,
    artifact => `\n\tcompile "${groupId}:${artifact}:${v}:${classifier}"`
  );

  addons.forEach((addon: Addon) => {
    const maven = addon.maven;
    script += `\n\tcompile "${maven.groupId}:${maven.artifactId}:${
      hardcoded ? maven.version : `\${${addon.id}Version}`
    }"`;
  });

  script += `\n}`;

  return script;
}

function generateIvy(props: ConnectedProps) {
  const { build, hardcoded, osgi, compact, artifacts, platform, platformSingle, selected, addons } = props;
  const version = getVersion(props.version, build);
  let script = '';
  const v = hardcoded ? version : '${lwjgl.version}';
  const nl1 = compact ? '' : '\n\t';
  const nl2 = compact ? '' : '\n\t\t';
  const nl3 = compact ? '' : '\n\t\t\t';
  const groupId = osgi ? 'org.lwjgl.osgi' : 'org.lwjgl';
  const classifier = !hardcoded || platformSingle == null ? '${lwjgl.natives}' : `natives-${platformSingle}`;

  if (!hardcoded || build !== BUILD_RELEASE) script += `\t<!-- Add to ivysettings.xml -->\n`;

  if (!hardcoded) {
    script += `\t<property name="lwjgl.version" value="${version}"/>`;

    addons.forEach((addon: Addon) => {
      script += `\n\t<property name="${addon.id}.version" value="${addon.maven.version}"/>`;
    });

    if (platformSingle !== null) {
      script += `\n\t<property name="lwjgl.natives" value="natives-${platformSingle}"/>`;
    }
    script += '\n\n';
  }

  if (build !== BUILD_RELEASE) {
    script += `\t<settings defaultResolver="maven-with-snapshots"/>
\t<resolvers>
\t\t<chain name="maven-with-snapshots">
\t\t\t<ibiblio name="sonatype-snapshots" m2compatible="true" root="https://oss.sonatype.org/content/repositories/snapshots/"/>
\t\t\t<ibiblio name="maven-central" m2compatible="true"/>
\t\t</chain>
\t</resolvers>\n\n`;
  }

  if (platformSingle === null) {
    script += `\t<!-- Add to build.xml -->
\t<condition property="lwjgl.natives" value="natives-windows">${nl2}<os family="Windows"/>${nl1}</condition>
\t<condition property="lwjgl.natives" value="natives-linux">${nl2}<os name="Linux"/>${nl1}</condition>
\t<condition property="lwjgl.natives" value="natives-macos">${nl2}<os name="Mac OS X"/>${nl1}</condition>\n\n`;
  }

  script += `\t<!-- Add to ivy.xml (xmlns:m="http://ant.apache.org/ivy/maven") -->
\t<dependencies>`;

  script += generateDependencies(
    selected,
    artifacts,
    platform,
    (artifact, hasEnabledNativePlatform) =>
      hasEnabledNativePlatform
        ? `\n\t\t<dependency org="${groupId}" name="${artifact}" rev="${v}">${nl3}<artifact name="${artifact}" type="jar"/>${nl3}<artifact name="${artifact}" type="jar" m:classifier="${classifier}"/>${nl2}</dependency>`
        : `\n\t\t<dependency org="${groupId}" name="${artifact}" rev="${v}"/>`,
    artifact => ''
  );

  addons.forEach((addon: Addon) => {
    const maven = addon.maven;
    script += `\n\t\t<dependency org="${maven.groupId}" name="${maven.artifactId}" rev="${
      hardcoded ? maven.version : `\${${addon.id}.version}`
    }"/>`;
  });

  script += `\n\t</dependencies>`;

  return script;
}
