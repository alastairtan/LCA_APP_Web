import { Connector } from './connector';

export class Rect {
    x;
    y;
    id;
    nextId: string[] = [];
    connectors: Connector[] = [];
    isClicked;
    categories;
    processName: string;

    constructor(x, y, id, nextId, connectors, isClicked, categories, processName) {
        this.x = x;
        this.y = y
        this.id = id;
        this.nextId = nextId;
        this.isClicked = isClicked;
        this.categories = categories;
        this.connectors = connectors;
        this.processName = processName;
    }

    setX(x) {
        this.x = x;
    }
  link(nextId) {
    nextId = nextId;
    }
    clearNextArrayConnect() {
        this.nextId = [];
        this.connectors = [];
    }
  getId() {
    return this.id;
    }

    setId(id) {
        this.id = id;
    }
    getX() {
        return this.x
    }

    //returns true if the connector is found
    removeConnector(id) {
        for (let i = 0; i < this.connectors.length; i++) {
            if (this.connectors[i] == id) {
                console.log('i am here');
                this.connectors.splice(i, 1);
                this.nextId.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    getConnectors() {
        return this.connectors;
    }

    setConnector(index, id) {
        this.connectors[index] = id;
    }
    getY() {
        return this.y
    }

    getNext() {
        return this.nextId;
    }

    getCategories() {
        return this.categories;
    }
    getIsClicked() {
        return this.isClicked;
    }

    setIsClicked(click: boolean) {
        this.isClicked = click;
    }

    equals(other: Rect) {
        var isEqual = true;
        //Compare SVG data
        isEqual = isEqual && (this.x == other.x);
        isEqual = isEqual && (this.y == other.y);
        isEqual = isEqual && (this.id == other.id);
        isEqual = isEqual && (this.categories == other.categories);
        isEqual = isEqual && (this.nextId.length == other.nextId.length);
        isEqual = isEqual && (this.connectors.length == other.connectors.length);
        if (!isEqual) {
            return false;
        }

        //Compare processNode details data
        for (var i = 0; i < this.nextId.length && isEqual; i++) {
            isEqual = isEqual && (other.nextId.includes(this.nextId[i]));
        }
        for (var i = 0; i < this.connectors.length && isEqual; i++) {
            isEqual = isEqual && (other.connectors.includes(this.connectors[i]));
        }
    }
}   
