
namespace ManualTracingTool {

    export interface UI_ToolWindow_Context {
        activeButtonID: string;
        test: string;
    }

    export interface UI_ToolWindow_Props {
        context: App_View;
    }

    export interface UI_ToolWindow_State {
        context: App_View;
    }

    export class UI_ToolWindow extends React.Component<UI_ToolWindow_Props, UI_ToolWindow_State> {

        activeElementID = '';

        constructor(props: UI_ToolWindow_Props) {
            super(props);

            this.state = {
                context: props.context
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

            if (this.activeElementID == id) {

                return 'selectedMainButton';
            }
            else {

                return 'unselectedMainButton';
            }
        }
    }
}