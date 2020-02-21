
namespace ManualTracingTool {

    interface UI_MenuButtons_State {

        activeElementID: string;
    }

    export class UI_MenuButtons extends React.Component<any, UI_MenuButtons_State> {

        constructor(props: any) {
            super(props);

            this.state = {
                activeElementID: ''
            };
        }

        render() {

            return (
                <React.Fragment>
                    <div id="menu_btnDrawTool" className={this.getClassName('menu_btnDrawTool')}>Draw</div>
                    <div id="menu_btnEditTool" className={this.getClassName('menu_btnEditTool')}>Edit</div>
                    <div id="menu_btnMiscTool" className={this.getClassName('menu_btnMiscTool')}>Setting</div>
                </React.Fragment>
            );
        }

        getClassName(id: string): string {

            if (this.state.activeElementID == id) {

                return 'selectedMainButton';
            }
            else {

                return 'unselectedMainButton';
            }
        }
    }
}