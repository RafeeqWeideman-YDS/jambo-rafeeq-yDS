import { FC, useState, useEffect, useContext } from 'react';
import cls from 'classnames';

import utilsStyles from '@styles/utils.module.scss';
import styles from '@styles/stepsPages.module.scss';
import ValidatorListItem from '@components/ValidatorListItem/ValidatorListItem';
import AmountAndDenom from '@components/AmountAndDenom/AmountAndDenom';
import { CARD_BG_COLOR, CARD_COLOR } from '@components/Card/Card';
import { ViewOnExplorerButton } from '@components/Button/Button';
import IconText from '@components/IconText/IconText';
import Header from '@components/Header/Header';
import Loader from '@components/Loader/Loader';
import Footer from '@components/Footer/Footer';
import Anchor from '@components/Anchor/Anchor';
import SadFace from '@icons/sad_face.svg';
import Success from '@icons/success.svg';
import { defaultTrxFeeOption, generateWithdrawRewardTrx } from '@utils/transactions';
import { broadCastMessages } from '@utils/wallets';
import { ReviewStepsTypes, StepDataType, STEPS } from 'types/steps';
import { KEPLR_CHAIN_INFO_TYPE } from 'types/chain';
import { TRX_MSG } from 'types/transactions';
import useGlobalValidators from '@hooks/useGlobalValidators';
import { WalletContext } from '@contexts/wallet';
import { ChainContext } from '@contexts/chain';

type ValidatorAddressProps = {
  onSuccess: (data: StepDataType<STEPS.review_and_sign>) => void;
  onBack?: () => void;
  data?: StepDataType<STEPS.get_validator_delegate>;
  header?: string;
  message: ReviewStepsTypes;
};

const ClaimRewards: FC<ValidatorAddressProps> = ({ onSuccess, onBack, header, message }) => {
  const [successHash, setSuccessHash] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const { wallet } = useContext(WalletContext);
  const { validators, validatorsLoading } = useGlobalValidators({ rewardedValidatorsOnly: true });
  const { chainInfo } = useContext(ChainContext);

  useEffect(() => {
    if (loading && validators !== null) setLoading(false);
  }, [validators]);

  const signTX = async (): Promise<void> => {
    if (!validators) return;
    setLoading(true);
    const trxs: TRX_MSG[] = validators.map((validator) =>
      generateWithdrawRewardTrx({
        delegatorAddress: wallet.user!.address,
        validatorAddress: validator.address,
      }),
    );
    const hash = await broadCastMessages(
      wallet,
      trxs,
      undefined,
      defaultTrxFeeOption,
      '',
      chainInfo as KEPLR_CHAIN_INFO_TYPE,
    );
    if (hash) setSuccessHash(hash);

    setLoading(false);
  };

  if (successHash)
    return (
      <>
        <Header header={header} />

        <main className={cls(utilsStyles.main, utilsStyles.columnJustifyCenter, styles.stepContainer)}>
          <IconText title='Your transaction was successful!' Img={Success} imgSize={50}>
            {chainInfo?.txExplorer && (
              <Anchor active openInNewTab href={`${chainInfo.txExplorer.txUrl.replace(/\${txHash}/i, successHash)}`}>
                <ViewOnExplorerButton explorer={chainInfo.txExplorer.name} />
              </Anchor>
            )}
          </IconText>
        </main>

        <Footer showAccountButton={!!successHash} showActionsButton={!!successHash} />
      </>
    );

  return (
    <>
      <Header header={header} />

      <main className={cls(utilsStyles.main, utilsStyles.columnJustifyCenter, styles.stepContainer)}>
        {loading || validatorsLoading ? (
          <Loader />
        ) : message === STEPS.distribution_MsgWithdrawDelegatorReward ? (
          validators?.length ? (
            <form className={styles.stepsForm} autoComplete='none'>
              <p>My delegations</p>
              {validators.map((validator: any, index: number) => {
                return <ValidatorListItem key={validator.address} validator={validator} />;
              })}
              <div className={utilsStyles.spacer3} />
              <p>Claim my combined rewards</p>
              <AmountAndDenom
                token={wallet.delegationRewards?.data?.total}
                microUnits={6}
                color={CARD_COLOR.lightGrey}
                bgColor={CARD_BG_COLOR.primary}
              />
            </form>
          ) : (
            <IconText title="You don't have any tokens delegated for this account." Img={SadFace} imgSize={50} />
          )
        ) : (
          <p>Unsupported review type</p>
        )}

        <Footer
          onBack={loading || successHash ? null : onBack}
          onBackUrl={onBack ? undefined : ''}
          onCorrect={loading || !!successHash ? null : signTX}
          correctLabel={loading ? 'Claiming' : !successHash ? 'Claim' : undefined}
          showAccountButton={!!successHash}
          showActionsButton={!!successHash}
        />
      </main>
    </>
  );
};

export default ClaimRewards;
