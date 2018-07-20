import React from 'react';
import {ModalContainer, ModalDialog} from 'react-modal-dialog';
import {Icon} from 'antd';
/*
props:
handleClose: function to do when requested to close.
isShowingModal: bool
subject: string
message: string
 */
class AlertDialog extends React.Component {

    handleClose = ()=>{
        this.props.handleClose();
    };
    render() {
        return <div>
            {
                this.props.isShowingModal &&
                <ModalContainer onClose={this.handleClose}>
                    <ModalDialog onClose={this.handleClose}>
                        <h1>{this.props.subject}</h1>
                        <div style={{display:'flex', flexDirection:'row',justifyContent:'center'}}>
                            <Icon type={this.props.icontype? this.props.icontype:"frown-o"} style={{fontSize:35, marginBottom:'10px'}}/>
                        </div>
                        <p>{this.props.message}</p>
                    </ModalDialog>
                </ModalContainer>
            }
        </div>;
    }
}

export default AlertDialog;