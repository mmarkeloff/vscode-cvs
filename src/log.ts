////////////////////////////////////////////////////////////////////
/**
 * Imports
 */
import {OutputChannel} from 'vscode';

/**
 * Interface for handle extension log
 */
interface ILog {
    print(to_log: string): void;
}

////////////////////////////////////////////////////////////////////
/**
 * Class for handle log by extension channel
 */
class ExtensionChannel implements ILog {
    private m_Channel: OutputChannel; ///< extension channel

    /**
     * Constructor
     * @param channel extension channel
     */
    constructor(channel: OutputChannel) {
        this.m_Channel = channel;
    }

    print(to_log: string) {
        this.m_Channel.appendLine(to_log);
    }
}

////////////////////////////////////////////////////////////////////
/**
 * Exports
 */
export {ILog, ExtensionChannel};