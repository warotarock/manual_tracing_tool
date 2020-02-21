
namespace ManualTracingTool {

    export function UI_CommandButtons({ props }) {

        const [items, setItems] = React.useState((() => {

            let init_Items = [];
            for (let i = 0; i < 30; i++) {

                init_Items.push(i);
            }

            return init_Items;
        })());

        return (
            <div>
                {
                    items.map(i => (
                        <div key={i}>{i}</div>
                    ))
                }
            </div>
        );
    }
}