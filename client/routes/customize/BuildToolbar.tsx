import React, { useContext, useState } from 'react';
import { BreakpointContext } from '~/components/Breakpoint';
import { Icon, Archive, SettingsBackupRestore } from '~/components/icons';
import type { BuildStoreSnapshot } from './types';

interface Props {
  configDownload: (event: React.MouseEvent<HTMLButtonElement>) => void;
  configLoad: (payload: BuildStoreSnapshot) => void;
}

export const BuildToolbar: React.FC<Props> = ({ configDownload, configLoad, children }) => {
  const {
    current,
    breakpoints: { sm },
  } = useContext(BreakpointContext);
  const [fileUI, setFileUI] = useState(false);

  const toggleFileUI = () => setFileUI(!fileUI);

  if (fileUI) {
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;

      if (files === null || files.length !== 1) {
        alert('Please select a configuration JSON file.');
        return;
      }

      let reader = new FileReader();
      reader.onload = () => {
        try {
          if (typeof reader.result !== 'string') {
            throw new Error('File must be JSON');
          }
          configLoad(JSON.parse(reader.result) as BuildStoreSnapshot);
          setFileUI(false);
        } catch (ignore) {
          alert('File does not contain a valid LWJGL configuration.');
        }
      };
      reader.readAsText(files[0]);
    };

    return (
      <div className="download-toolbar">
        <div className="container d-flex">
          <div className="custom-file mx-2">
            <input type="file" className="custom-file-input" accept=".json" onChange={handleFile} />
            <label className="custom-file-label" />
          </div>
          <button className="btn btn-outline-light mx-2" onClick={toggleFileUI}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const showLabels = current > sm;

  return (
    <div className="download-toolbar">
      {children}
      <button className="btn btn-outline-light" title="Load configuration file (JSON)" onClick={toggleFileUI}>
        <Icon children={<SettingsBackupRestore />} />
        {showLabels ? ` Load config` : null}
      </button>
      <button className="btn btn-outline-light" title="Save configuration (in JSON)" onClick={configDownload}>
        <Icon children={<Archive />} />
        {showLabels ? ` Save config` : null}
      </button>
    </div>
  );
};
