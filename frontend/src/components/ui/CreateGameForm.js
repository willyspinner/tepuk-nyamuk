import {Form, Icon, Input, Button,Row,Col,Slider,InputNumber} from 'antd';
import React from 'react';


class NormalLoginForm extends React.Component {
    state = {
        numberOfMaxPlayers :4,
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.props.onGameFormSubmit({...values,numberOfMaxPlayers: this.state.numberOfMaxPlayers});
                console.log('Received values of form: ', {...values,numberOfMaxPlayers: this.state.numberOfMaxPlayers});
            }
        });
    };

    render() {
        const {getFieldDecorator} = this.props.form;
        return (
            <Form onSubmit={this.handleSubmit} className="login-form" style={{marginTop:"4px"}}>
                <Form.Item>
                    {getFieldDecorator('name', {
                        rules: [{required: true, message: 'Please input your GameRoom name!'}],
                    })(
                        <Input prefix={<Icon type="smile-o" style={{color: 'rgba(0,0,0,.25)'}}/>} placeholder="Gameroom name"/>
                    )}
                </Form.Item>
                <Form.Item>
                    <Row>
                        <h3 style={{color:'white'}}>Number of players:</h3>
                        <Col span={12}>
                            <Slider min={2} max={8} onChange={(val)=>this.setState({numberOfMaxPlayers:val})} value={this.state.numberOfMaxPlayers} />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                min={2}
                                max={8}
                                style={{ marginLeft: 16 }}
                                onChange={(val)=>this.setState({numberOfMaxPlayers:val})}
                                value={this.state.numberOfMaxPlayers}
                            />
                        </Col>
                    </Row>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        Create Game
                    </Button>
                    <Button onClick={this.props.onClose}
                            type="danger"
                            style={{margin:'7px'}}
                    >
                        <Icon type="close" />
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const CreateGameForm = Form.create()(NormalLoginForm);
export default CreateGameForm;

