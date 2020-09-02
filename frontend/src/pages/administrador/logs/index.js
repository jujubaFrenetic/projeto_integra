import React from 'react';
import {connect} from "react-redux";
import AdministradorTopbar from "../../../assets/component/adm_topbar/adm_topbar";
import CardLog from "../../../assets/component/card_log/cardLog";
import "./logs.sass";
import Actions from "../../../redux/actions/actions";
import {Redirect, useHistory} from "react-router";
import logDAO from "../../../DAO/logDAO";

const LogsPage = props => {

    const hist = useHistory();

    if ('ocupacao' in props.userLogged) {
        hist.push('/');
    }

    const [pages, setPages] = React.useState([])
    const [selectedPage, setPage] = React.useState(1)

    React.useEffect(() => {
        if (props.logs) {
            setPages(Array.from(Array(Math.ceil(props.logs.length / 25)), (_, i) => i + 1))
        }
    }, [props.logs])

    React.useEffect(() => {
        logDAO.findAll().then(result => {
            props.setLogs(result)
        })
    }, [])
    if (!props.userLogged) {
        return (<Redirect to={'/'} />)
    }
    return (
        <div>
            <AdministradorTopbar pageSelected={'logs'} />
            <div className={'logs'}>
                {
                    (props.logs.length === 0) ?
                        (<h2 style={{color: '#888'}}>Ainda não há logs para exibir.</h2>) :
                        props.logs.reverse().map((log, index) => (
                            index < (15 * selectedPage) && (index > (15 * (selectedPage - 1))) ? <CardLog log={log}/> : <></>
                        ))
                }
                <div className={'pages'}>
                    {pages.map(page => <div
                        className={page === selectedPage ? 'page selected': 'page'}
                        onClick={() => {
                        setPage(page)
                    }}>
                        {page}
                    </div>)}
                </div>
            </div>
        </div>
    )
}

const mapStateToProps = state => ({
    logs: state.logs.logs,
    userLogged: state.general.userLogged,
});

const mapDispatchToProps = dispatch => ({
    setLogs: logs => dispatch({type: Actions.setLogs, payload: logs}),
});

export default connect(mapStateToProps, mapDispatchToProps)(LogsPage);
