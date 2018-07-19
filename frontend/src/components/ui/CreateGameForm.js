import {Form, Icon, Input, Button,Row,Col,Slider,InputNumber} from 'antd';
import React from 'react';


class NormalLoginForm extends React.Component {
    state = {
        numberOfPlayers :2,
    }
    handleSubmit = (e) => {
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                this.props.onGameFormSubmit({...values,numberOfPlayers: this.state.numberOfPlayers});
                console.log('Received values of form: ', {...values,numberOfPlayers: this.state.numberOfPlayers});
            }
        });
    };

    render() {
        const {getFieldDecorator} = this.props.form;
        return (
            <Form onSubmit={this.handleSubmit} className="login-form" style={{marginTop:"12px"}}>
                <Form.Item>
                    {getFieldDecorator('name', {
                        rules: [{required: true, message: 'Please input your GameRoom name!'}],
                    })(
                        <Input prefix={<Icon type="smile-o" style={{color: 'rgba(0,0,0,.25)'}}/>} placeholder="Gameroom name"/>
                    )}
                </Form.Item>
                <Form.Item>
                    <div>
                    <Row>
                        <h3>Number of players:</h3>
                        <Col span={12}>
                            <Slider min={2} max={8} onChange={(val)=>this.setState({numberOfPlayers:val})} value={this.state.numberOfPlayers} />
                        </Col>
                        <Col span={4}>
                            <InputNumber
                                min={2}
                                max={8}
                                style={{ marginLeft: 16 }}
                                onChange={(val)=>this.setState({numberOfPlayers:val})}
                                value={this.state.numberOfPlayers}
                            />
                        </Col>
                    </Row>
                    </div>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button">
                        Create Game
                    </Button>
                </Form.Item>
            </Form>
        );
    }
}

const CreateGameForm = Form.create()(NormalLoginForm);
export default CreateGameForm;

