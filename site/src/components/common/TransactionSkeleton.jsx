// TransactionSkeleton - Skeleton loader for transaction history list
import { Skeleton } from './Skeleton';
import './TransactionSkeleton.css';

export function TransactionSkeleton({ count = 5, message }) {
  return (
    <>
      {message && <div className="transaction-loading-message">{message}</div>}
      <div className="transaction-list">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="transaction-item skeleton-row">
            <div className="transaction-info">
              <div className="transaction-description">
                <Skeleton width={i % 2 === 0 ? '180px' : '140px'} height="16px" />
              </div>
              <div className="transaction-date">
                <Skeleton width="120px" height="12px" />
              </div>
            </div>
            <div className="transaction-amount">
              <Skeleton width="40px" height="18px" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default TransactionSkeleton;
