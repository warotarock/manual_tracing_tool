import * as React from 'react';
import 'rc-slider/assets/index.css';

export interface UI_SideBarContentInfo {

  key: number;
  id: string;
  component: any;
  uiRef: any;
  icon: string;
  isOpened?: boolean;
}

export interface UI_SideBarContainerRef {

  hide?: () => void;
  show?: () => void;
  toggleContent?: (id: string) => void;

  contentOpen?: (cotentInfo: UI_SideBarContentInfo) => void;
  contentClosed?: (cotentInfo: UI_SideBarContentInfo) => void;
}

export interface UI_SideBarContainerParam {

  dockingTo: 'left' | 'right';
  contents: UI_SideBarContentInfo[];
  uiRef: UI_SideBarContainerRef;
}

export function UI_SideBarContainer({ dockingTo, contents, uiRef }: UI_SideBarContainerParam ) {

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [contentInfos, setContentInfos] = React.useState(contents);

  React.useEffect(() => {

    uiRef.show = () => {

      containerRef.current.parentElement.classList.remove('hidden');
    };

    uiRef.hide = () => {

      containerRef.current.parentElement.classList.add('hidden');
    };

    uiRef.toggleContent = (id: string) => {

      const content = contents.find(ct => ct.id == id);

      if (content) {

        content_Click(content);
      }
    };

    return function cleanup() {
    };
  });

  function leftRight(): string {

    return (dockingTo == 'left' ? 'left-panel' : 'right-panel');
  }

  function closed(contentInfo: UI_SideBarContentInfo): string {

    return (!contentInfo.isOpened ? 'closed' : '');
  }

  function content_Click(cotentInfo: UI_SideBarContentInfo) {

    cotentInfo.isOpened = !(cotentInfo.isOpened);

    if (cotentInfo.isOpened) {

      if (uiRef.contentOpen) {

        uiRef.contentOpen(cotentInfo);
      }
    }
    else {

      if (uiRef.contentClosed) {

        uiRef.contentClosed(cotentInfo);
      }
    }

    setContentInfos(contentInfos.slice());

    // console.log('tab_Click', cotentInfo);
  }

  return (
    <React.Fragment>
      <div className={`side-panel-contents`} ref={containerRef}>
        {
          contentInfos.map(contentInfo => (
              <div key={contentInfo.key} className={`side-panel-content ${leftRight()}`}>
                <div className={`content-container ${leftRight()} ${closed(contentInfo)}`}>
                  <contentInfo.component uiRef={contentInfo.uiRef}></contentInfo.component>
                </div>
                {
                  (contentInfo.key == 9999) ? null :
                  <div className={`tab-locator ${leftRight()} ${closed(contentInfo)}`}>
                    <div className={`side-panel-tab ${leftRight()} ${closed(contentInfo)}`}
                    onClick={() => content_Click(contentInfo)}
                    >
                      <i className="material-icons">{contentInfo.icon}</i>
                    </div>
                  </div>
                }
              </div>
            )
          )
        }
      </div>
    </React.Fragment>
  );
}
