
namespace ManualTracingTool {

    export function UI_CommandButtons() {

        let init_Items = [];
        for (let i = 0; i < 30; i++) {

            init_Items.push(i);
        }

        const [count, setCount] = React.useState(0);
        const [items, setItems] = React.useState(init_Items);

        return (
            <div>
                {
                    items.map(i => (
                        <div className="list-item" key={i}>{i}</div>
                    ))
                }
                <div>
                    <p>You clicked {count} times</p>
                    <button onClick={() => { setCount(count + 1); }}>Click me</button>
                </div>
            </div>
        );
    }
}