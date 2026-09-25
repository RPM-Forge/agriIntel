import { Icon } from "./Icon";

export interface FPO {
  name: string;
  district?: string;
  state?: string;
  members?: number;
  totalProduce?: string;
  activeBuyers?: number;
  about?: string;
}

export default function FPOCard({ fpo }: { fpo: FPO }) {
  return (
    <article className="fpo-card">
      <div className="fpo-card__head">
        <span className="fpo-card__logo">
          <Icon name="users" size={22} />
        </span>
        <div className="fpo-card__name">
          <h3>{fpo.name}</h3>
          {fpo.district && (
            <p>
              {fpo.district}
              {fpo.state ? `, ${fpo.state}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="fpo-card__stats">
        {fpo.members != null && (
          <span>
            <strong>{fpo.members}</strong>
            <small>Members</small>
          </span>
        )}
        {fpo.totalProduce != null && (
          <span>
            <strong>{fpo.totalProduce}</strong>
            <small>Total Produce</small>
          </span>
        )}
        {fpo.activeBuyers != null && (
          <span>
            <strong>{fpo.activeBuyers}</strong>
            <small>Active Buyers</small>
          </span>
        )}
      </div>

      {fpo.about && <p className="fpo-card__about">{fpo.about}</p>}
    </article>
  );
}