#!/usr/bin/env node

//BST implementation.
class Node{
    constructor(leftChild,currentVal,rightChild){
        this.leftChild = leftChild;
        this.rightChild = rightChild;
        this.val = currentVal;
        }

}

function(timeArray){// where timeArray is a json object array, each element
//being a {'username': username, 'time': time} format.

var parentNode = new Node(undefined, timeArray.pop(),undefined);

timeArray.forEach(function(timeData){
    var tempNode = parentNode;
    while( ! (tempNode.leftChild.val < timeData['time'] && tempNode.rightChild.val > timeData['time'])){
        //do something. Is this even correct?
        if( typeof(tempNode.leftChild) == 'undefined' && typeof(tempNode.rightChild) == 'undefined'){
            if(tempNode.val > timeData['time'])
                  tempNode.rightChild = timeData;
            else tempNode.leftChild = timeData;
            }
        else (if )
        }
    });


}
