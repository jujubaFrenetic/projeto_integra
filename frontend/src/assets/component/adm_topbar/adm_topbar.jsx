import React from 'react';
import PropTypes from 'prop-types';
import "./styles.sass";
import {useHistory} from 'react-router-dom';
import HamburgerMenu from "../hamburgerMenu/hamburgerMenu";
import ResponsiveMenu from "../responsiveMenu/responsiveMenu";
import {connect} from "react-redux";
import Actions from "../../../redux/actions/actions";
import Button from "../button/button";

const Tab = props => {
    const story = useHistory();

    return (
            <div onClick={() => {
                story.push('/' + props.page);
            }} className={'tab ' + (props.selected ? 'selected': '')}>
                <p>{props.children}</p>

            </div>
    )
};

const AdministradorTopbar = ({pageSelected, userLogged, setUserLogged}) => {

    const [hambOpen, setHambOpen] = React.useState(false);

    const hist = useHistory();

    const logout = () => {
        setUserLogged({});
        localStorage.removeItem('email');
        localStorage.removeItem('pwd');
        hist.push('/');
    };

    return (
        <div className={'topbar_container topbar_container_adm'}>
            <HamburgerMenu onClick={() => setHambOpen(true)}/>
            <ResponsiveMenu open={hambOpen} pageSelected={pageSelected} onClick={() => setHambOpen(false)}/>
            {/*<div className={'img_container'}>*/}
            {/*    <div className={'hamb'}>*/}
            {/*        <div/>*/}
            {/*        <div/>*/}
            {/*        <div/>*/}
            {/*    </div>*/}
            {/*    <img src={require('../../integra_g.png')} alt={''} />*/}
            {/*</div>*/}
            <div className={'img_container'}>
                <img
                    alt={'integra_logo'}
                    src={require('../../integra_logo.png')}/>
            </div>
            <div className={'tabs'}>
                <Tab
                    page={'dashboard'}
                    selected={pageSelected === 'dashboard'}>
                    Dashboard
                </Tab>
                <Tab
                    page={'agendamento_adm'}
                    selected={pageSelected === 'agendamento_adm'}>
                    Agendamentos
                </Tab>
                <Tab page={'profissionais'} selected={pageSelected === 'profissionais'}>Profissionais</Tab>
                <Tab page={'administrativo'}  selected={pageSelected === 'administrativo'}>Administrativo</Tab>
                <Tab page={'salas'}  selected={pageSelected === 'salas'}>Salas</Tab>
                <Tab page={'logs'} selected={pageSelected === 'logs'}>Logs</Tab>
            </div>
            <div className={'user_data'}>
                <div>
                    <h2>{userLogged ? userLogged.nome : 'Catherine Torres'}</h2>
                    <h4>Administrador</h4>
                </div>
            </div>
            <img
                alt={'profile_pic'}
                className={'profile_pic'} src={userLogged ? userLogged.foto_url : 'https://randomuser.me/api/portraits/women/43.jpg'}/>
            <Button
                onClick={() => {
                    logout();
                }}
                width={'5%'}
                text={<i className={'fas fa-door-open'}/>}
                className={'log-off'}/>
        </div>
    )
};

AdministradorTopbar.propTypes = {
    pageSelected: PropTypes.string.isRequired,
};

const mapStateToProps = state => ({
    userLogged: state.general.userLogged,
});

const mapDispatchToProps = dispatch => ({
    setUserLogged: user => dispatch({type: Actions.setUserLogged, payload: user}),
});

export default connect(mapStateToProps, mapDispatchToProps)(AdministradorTopbar);