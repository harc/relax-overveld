/**
 * Created by lowellbander on 5/29/16.
 */

class Field {
    static interest(context) {
        return {
            label: 'Interest',
            defaultValue: context.interest.name.toUri(),
            onChange: e => context.interest = new Interest(e.target.value),
        }
    }
    
     static data(context) {
        return {
            label: 'Data',
            defaultValue: context.data.name.toUri(),
            onChange: e => context.data = new Data(e.target.value),
        };
    }
    
    static name(context) {
        return {
            label: 'Name',
            defaultValue: context.name,
            onChange: e => context.name = e.target.value,
        }
    }
}