import { BuildType } from '../types';
import { generateDependencies, getArtifactName, getVersion, isNativeApplicableToAllPlatforms } from './script';

import type { State } from '../BuildScript';
import type { Addon } from '../types';

export function generateIvy({
  build,
  version,
  hardcoded,
  osgi,
  compact,
  artifacts,
  platform,
  platformSingle,
  selected,
  addons,
  selectedAddons,
}: State) {
  const versionString = getVersion(version, build);
  let script = '';
  const v = hardcoded ? versionString : '${lwjgl.version}';
  const nl1 = compact ? '' : '\n\t';
  const nl2 = compact ? '' : '\n\t\t';
  const nl3 = compact ? '' : '\n\t\t\t';
  const classifier = !hardcoded || platformSingle == null ? '${lwjgl.natives}' : `natives-${platformSingle}`;

  if (!hardcoded || build !== BuildType.Release) script += `\t<!-- Add to ivysettings.xml -->\n`;

  if (!hardcoded) {
    script += `\t<property name="lwjgl.version" value="${versionString}"/>`;

    selectedAddons.forEach((id: Addon) => {
      script += `\n\t<property name="${id}.version" value="${addons[id].maven.version}"/>`;
    });

    if (platformSingle !== null) {
      script += `\n\t<property name="lwjgl.natives" value="natives-${platformSingle}"/>`;
    }
    script += '\n\n';
  }

  if (build !== BuildType.Release) {
    script += `\t<settings defaultResolver="maven-with-snapshots"/>
\t<resolvers>
\t\t<chain name="maven-with-snapshots">
\t\t\t<ibiblio name="sonatype-snapshots" m2compatible="true" root="https://oss.sonatype.org/content/repositories/snapshots/"/>
\t\t\t<ibiblio name="maven-central" m2compatible="true"/>
\t\t</chain>
\t</resolvers>\n\n`;
  }

  if (platformSingle === null) {
    script += `\t<!-- Add to build.xml -->`;
    const linuxArches = +platform.linux + +platform['linux-arm64'] + +platform['linux-arm32'];
    if (linuxArches !== 0) {
      if (linuxArches === 1) {
        script += `
\t<condition property="lwjgl.natives" value="natives-linux${
          platform.linux ? '' : platform['linux-arm64'] ? '-arm64' : '-arm32'
        }">${nl2}<os name="Linux"/>${nl1}</condition>`;
      } else {
        if (platform.linux) {
          script += `
\t<condition property="lwjgl.natives" value="natives-linux">
\t\t<and>
\t\t\t<os name="Linux"/>
\t\t\t<not><matches string="\${os.arch}" pattern="^(arm|aarch64)"/></not>
\t\t</and>
\t</condition>`;
        }
        if (platform['linux-arm64']) {
          script += `
\t<condition property="lwjgl.natives" value="natives-linux-arm64">
\t\t<and>
\t\t\t<os name="Linux"/>
\t\t\t<matches string="\${os.arch}" pattern="^(arm|aarch64)"/>
\t\t\t<matches string="\${os.arch}" pattern="64|^armv8"/>
\t\t</and>
\t</condition>`;
        }
        if (platform['linux-arm32']) {
          script += `
\t<condition property="lwjgl.natives" value="natives-linux-arm32">
\t\t<and>
\t\t\t<os name="Linux"/>
\t\t\t<matches string="\${os.arch}" pattern="^(arm|aarch64)"/>
\t\t\t<not><matches string="\${os.arch}" pattern="64|^armv8"/></not>
\t\t</and>
\t</condition>`;
        }
      }
    }
    if (platform.macos) {
      script += `
\t<condition property="lwjgl.natives" value="natives-macos">${nl2}<os name="Mac OS X"/>${nl1}</condition>`;
    }
    const windowsArches = +platform.windows + +platform['windows-x86'];
    if (windowsArches !== 0) {
      if (windowsArches === 1) {
        script += `
\t<condition property="lwjgl.natives" value="natives-windows${
          platform.windows ? '' : '-x86'
        }">${nl2}<os family="Windows"/>${nl1}</condition>`;
      } else {
        if (platform.windows) {
          script += `
\t<condition property="lwjgl.natives" value="natives-windows">
\t\t<and>
\t\t\t<os family="Windows"/>
\t\t\t<matches string="\${os.arch}" pattern="64"/>
\t\t</and>
\t</condition>`;
        }
        if (platform['windows-x86']) {
          script += `
\t<condition property="lwjgl.natives" value="natives-windows-x86">
\t\t<and>
\t\t\t<os family="Windows"/>
\t\t\t<not><matches string="\${os.arch}" pattern="64"/></not>
\t\t</and>
\t</condition>`;
        }
      }
    }
    let classifierOverrides = selected
      .filter(binding => !isNativeApplicableToAllPlatforms(artifacts[binding], platform))
      .map(binding => {
        let artifact = artifacts[binding];
        if (artifact.natives === undefined) {
          // cannot happen
          return '';
        }

        let predicates = artifact.natives
          .filter(p => platform[p])
          .map(p => `<equals arg1="\${lwjgl.natives}" arg2="native-${p}"/>`);

        return `\t<condition property="lwjgl.natives.${getArtifactName(
          artifact
        )}" value="\${lwjgl.natives}" else="">${nl2}${
          predicates.length === 1 ? predicates : `<or>${nl3}${predicates.join(nl3)}${nl2}</or>`
        }${nl1}</condition>`;
      })
      .join(nl3);
    if (classifierOverrides.length !== 0) {
      script += `\n${classifierOverrides}`;
    }
    script += `\n\n`;
  }

  script += `\t<!-- Add to ivy.xml (xmlns:m="http://ant.apache.org/ivy/maven") -->
\t<dependencies>`;
  script += generateDependencies(
    selected,
    artifacts,
    platform,
    osgi,
    (artifact, groupId, artifactId, hasEnabledNativePlatform) =>
      `\n\t\t<dependency org="${groupId}" name="${artifactId}" rev="${v}"${
        hasEnabledNativePlatform
          ? `>${nl3}<artifact name="${artifactId}" type="jar"/>${nl3}<artifact name="${artifactId}" type="jar" m:classifier="${
              isNativeApplicableToAllPlatforms(artifact, platform)
                ? classifier
                : `\${lwjgl.natives.${getArtifactName(artifact)}}`
            }"/>${nl2}</dependency>`
          : '/>'
      }`
  );

  selectedAddons.forEach((id: Addon) => {
    const {
      maven: { groupId, artifactId, version },
    } = addons[id];
    script += `\n\t\t<dependency org="${groupId}" name="${artifactId}" rev="${
      hardcoded ? version : `\${${id}.version}`
    }"/>`;
  });

  script += `\n\t</dependencies>`;

  return script;
}
